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

app.use("api/auth",authRoutes);

app.get("/", (req, res) => {
  res.send("This is home page");
});

app.get("/login", (req, res) => {
  res.render("Login");
});

app.get("/signup", (req, res) => {
  res.render("Signup");
});

app.post("/signup", async (req, res) => {
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
  res.send(`Welcome ${user.username}`);
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

app.post("/login", async (req, res) => {
  let { username, password } = req.body;

  if (!username || !password) {
    return res.send("Username and password both are required");
  }

  let user = await User.findOne({ username });
  if (!user) {
    return res.send("User not found");
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.send("wrong password");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("accessToken", accessToken, {
    secure: false,
    sameSite: "strict",
  });
  res.cookie("refreshToken", refreshToken, {
    secure: false,
    sameSite: "strict",
  });
  res.json({ accessToken });
});

app.get("/refresh", (req, res) => {
  res.send("Changing token");
});

app.post("/refresh", async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).send("No refresh token");
  }
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).send("Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(user);
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
  if (!token) return res.sendStatus(204);

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

    const user = await User.findById(decoded.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  } catch (e) {
    res.send(e);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.send("Logged out");
});

mongoose
  .connect(process.env.URI)
  .then(() => {
    console.log("DB connected");

    app.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch((err) => console.error("DB connection error:", err));
