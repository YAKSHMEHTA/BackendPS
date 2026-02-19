import { Schema } from "mongoose";


let Userschema = new Schema({
    username: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true }
})

export default Userschema ;