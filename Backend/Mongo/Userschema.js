import { Schema } from "mongoose";


let Userschema = new Schema({
    username: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    devices: [
        {
            deviceName:String,
            IPAdress:String,
            deviceId:String,
            refreshToken:String,
            date:Date,
        }
    ],
})

export default Userschema ;