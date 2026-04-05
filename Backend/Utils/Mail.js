import nodemailer, { createTransport } from 'nodemailer'
import dotenv from "dotenv";
dotenv.config();

const transporter = createTransport({
    service:"gmail",
    auth:{
        user:process.env.GMAIL_USER,
        pass:process.env.GMAIL_PASS,
    }
})

export const sendEmail = async(email,username)=> {
    const mailOptions = {
        from:`"BackendPs:" <${process.env.GMAIL_user}>`,
        to:email,
        subject: "Welcome to BackendPS!",
         html: `
             <h2>Hey ${username} 👋</h2>
             <p>Thanks for signing up. Your account is ready.</p>
        `,
    }
    await transporter.sendMail(mailOptions)
}

