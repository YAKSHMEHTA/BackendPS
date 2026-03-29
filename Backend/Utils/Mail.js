import nodemailer, { createTransport } from 'nodemailer'

const transporter = createTransport({
    service:"gmail",
    auth:{
        user:process.env.GMAIL_USER,
        pass:process.env.GMAIL_PASS,
    }
})

export const sendEmail = ()=> {

}