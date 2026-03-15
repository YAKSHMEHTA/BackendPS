import express from "express";
import { login, signup,logoutall } from "./authControllers.js"

const router = express.Router();

router.post("/login",login);
router.post("/signup",signup);
router.post("/logoutall",logoutall);

export default router;