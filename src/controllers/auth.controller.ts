import { PrismaClient } from "@prisma/client";
import { Request , Response } from "express";
import bcrypt from 'bcrypt'
import { RegisterSchema } from '../validations/auth.validation'

const prisma = new PrismaClient()

export const RegisterUser = async (req:Request, res: Response ) => {

    const parsed = RegisterSchema.safeParse(req.body);

    if(!parsed.success){
         return res.status(400).json({ error: parsed.error.flatten().fieldErrors})
    }
const { name , password ,email,role } = parsed.data;

try{

    const exitingUser = await prisma.user.findUnique({
        where: { email}
    })
    if(exitingUser){
        return res.status(400).json("User alrady exits")
    }

    const hashedPassword = await bcrypt.hash(password , 10)

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
        }
    })

    const otpCode = await Math.floor(100000 + Math.random() * 900000 ).toString();
  await prisma.oTP.create({
    data: {
        otp : otpCode,
        userId : user.id,
        updatedAt: new Date(Date.now() + 5*60*1000)
    }
 })

 console.log("opt send : ", otpCode);

 return res.status(200).json({
       message: "Register Successfully OTP Send to email",
       userId : user.id,
 })


} catch(e){
    console.error(e)
return res.status(500).json({ message: "Server Error " , e})

}



}

