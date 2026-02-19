import { model } from "mongoose";
import Userschema from "./Userschema.js";


let User = new model("User",Userschema);

export default User;