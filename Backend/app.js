import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./Mongo/Usermodel.js";


dotenv.config();

const app = express();
app.set("view engine","ejs");
app.use(express.urlencoded({ extended: true }));

const PORT = 8000;

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

mongoose.connect(process.env.URI)
  .then(() => {
    console.log("DB connected");

    app.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch((err) => console.error("DB connection error:", err));
