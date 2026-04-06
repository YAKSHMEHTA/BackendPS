import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./Mongo/Usermodel.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import authRoutes from "./Controllers/authRoutes.js"

dotenv.config();

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
const PORT = 8000;
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("This is home page");
});

app.get("/login", (req, res) => {
  res.render("Login");
});

app.get("/signup", (req, res) => {
  res.render("Signup");
});



function authWare(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).send("Not authenticated");
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send("Invalid or expired token");
  }
}



app.get("/dashboard", authWare, async (req, res) => {
  const user = await User.findById(req.user.id);
  const devices = await user.devices;
  res.render("Dashboard",{devices});
});

// app.get("/logout",(req,res)=>{
//   res.clearCookie("accessToken")
//   res.send("Loged out")
// })

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });
};



app.get("/refresh", (req, res) => {
  res.send("Changing token");
});

app.post("/refresh", async (req, res) => {
  const token = req.cookies.refreshToken;
  const deviceId = req.cookies.deviceId
  if (!token) {
    return res.status(401).send("No refresh token");
  }
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!deviceId) return res.status(403).send("Invalid token");
    if (!user) return res.status(403).send("Invalid token");
    const device = user.devices.find(d => d.deviceId === deviceId);
    const newAccessToken = generateAccessToken(user);
    const newrefreshToken = generateRefreshToken(user);
    if (device.refreshToken !== token) {
      return res.status(403).send("Invalid refresh token");
    }
    device.refreshToken = newrefreshToken;
    await user.save();
    res.cookie("refreshToken", newrefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    })
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    return res.json({ message: "Access token refreshed" });
  } catch (e) {
    res.send(e);
  }
});

app.post("/logout", async (req, res) => {
  const token = req.cookies.accessToken;
  const deviceId = req.cookies.deviceId;
  if (!token) return res.sendStatus(204);

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

    const user = await User.findById(decoded.id);
    if (user) {
      user.devices = user.devices.filter(d => d.deviceId !== deviceId)
      await user.save();
    }
  } catch (e) {
    res.send(e);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.clearCookie("deviceId");
  res.send("Logged out");
});

const requireRole = (role) => {
  return (req, res, next) => {
    {
      try {
        const token = req.cookies.refreshtoken;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role != role) {
          return res.send("not authorizer");

        } next();
      } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }
  }

  }

   mongoose
    .connect(process.env.URI)
    .then(() => {
      console.log("DB connected");

      app.listen(PORT, () => {
        console.log("Server running on port", PORT);
      });
    })
    .catch((err) => console.error("DB connection error:", err))
