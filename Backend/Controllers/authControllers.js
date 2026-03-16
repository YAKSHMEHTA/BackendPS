import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { UAParser } from "ua-parser-js";
import User from "../Mongo/Usermodel.js";
import crypto from "crypto";
const router = express.Router();

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id ,role:user.role}, process.env.ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id ,role:user.role}, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send("type both fields");
  

  const user = await User.findOne({ username });
  if (!user) return res.send("user not found");
  if(username == "yaksh"){
    user.role = "admin"
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.send("wrong password");

  const refreshToken = generateRefreshToken(user);
  const accessToken = generateAccessToken(user);
  let deviceId = req.cookies.deviceId;

  if (deviceId) {
    let existingDevice = user.devices.find((d) => d.deviceId === deviceId);
    if (existingDevice) {
      existingDevice.refreshToken = refreshToken;
    }
  } else {
    const IP = req.ip;
    const parser = new UAParser(req.headers["user-agent"]);
    const deviceName = `${parser.getBrowser().name} on ${parser.getOS().name}`;
    const deviceId = crypto.randomUUID();

    user.devices.push({
      deviceName: deviceName,
      IPAdress: IP,
      deviceId: deviceId,
      refreshToken: refreshToken,
      date: Date.now(),
    });
    res.cookie("deviceId", deviceId, {
      sameSite: "strict",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
  }

  await user.save();

  res.cookie("refreshToken", refreshToken, {
    secure: false,
    sameSite: "strict",
  });
  res.cookie("accessToken", accessToken, {
    secure: false,
    sameSite: "strict",
  });
  res.send("login succesfull");
};

export const signup = async (req, res) => {
  let { username, email, password } = req.body;
  console.log(req.body);
  let user = await User.findOne({ username });
  if (user) {
    return res.send("user already exist");
  }
  let hassedPassword = await bcrypt.hash(password, 10);
  let newuser = new User({
    username: username,
    email: email,
    password: hassedPassword,
  });
  await newuser.save();
  res.send("Signup successful");
};

export const logoutall  = async (req,res) => {
  const token = req.cookies.refreshToken;
  if(!token) return res.send("No token Found");
  const decoded = jwt.verify(token,process.env.REFRESH_SECRET);
  const user = await User.findById(decoded.id);
  if(!user) return res.send("no user found Invalid token");
  user.devices = [];
  await user.save();
  res.send("All devices Logged out");

}