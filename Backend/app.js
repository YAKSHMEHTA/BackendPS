import express from 'express';


const app = express();

app.get("/",(req,res)=>{
    res.send("This is home page");
})

app.listen("8000",(req,res)=>{
    console.log('Server running');
})