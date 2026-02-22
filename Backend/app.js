import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./Mongo/Usermodel.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";


dotenv.config();

const app = express();
app.set("view engine","ejs");
app.use(express.urlencoded({ extended: true }));
const JWT_SECRET = "mysecretkey";
const PORT = 8000;
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("This is home page");
});

app.get("/login",(req,res)=>{
  res.render("Login")
})

app.get("/signup", (req,res)=>{
  res.render("Signup")
})

app.post("/signup",async(req,res)=>{
  let {username,email,password} = req.body;
  console.log(req.body);
  let user = await User.findOne({username});
  if(user){
    return res.send("user already exist");
  }
  let newuser = new User({
    username:username,
    email:email,
    password:password
  })
  await newuser.save();
   res.send("Signup successful");
})

function authWare(req,res,next){

  const token = req.cookies.token;

  if(!token){
    res.send("Not authenticated, please login");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next()
  } catch (err) {
    res.status(401).send("Invalid token");
  }
}

app.get("/dashboard", authWare, (req, res) => {
  res.send(`Welcome ${req.user.username}`);
});

app.get("/logout",(req,res)=>{
  res.clearCookie("token")
  res.send("Loged out")
})

app.post("/login",async(req,res)=>{
  let {username,password} = req.body;

  if(!username || !password){
    return res.send("Username and password both are required");
  }

  let user = await User.findOne({username});
  if(!user){
    return res.send("User not found");
  }
  if(user.password != password){
    return res.send("Wrong password");
  }

  const token = jwt.sign(
    {id:user._id,username:user.username},
    JWT_SECRET,
    {expiresIn:"1h"}

  );

  res.cookie("token",token,{
    httpOnly:true,
    secure:false,
    maxAge:60*60*1000
  })

  res.json({
    message: "Login successful",
    token: token
  });

})

mongoose.connect(process.env.URI)
  .then(() => {
    console.log("DB connected");

    app.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch((err) => console.error("DB connection error:", err));
