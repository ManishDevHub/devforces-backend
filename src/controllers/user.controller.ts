import { Request, Response } from "express";
import  prisma   from '../config/prisma'
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'




const JWT_SECRET = process.env.JWT_SECRET || "sdddsdsgsgsgs";
const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
};

 export const register =  async (req: Request, res: Response) =>{
const { name , email , password , role} = req.body;

const existingUser = await prisma.user.findUnique({
  where:{email}
})

if(existingUser){
  return res.status(400).json({
    message: "User alrady exists"
  })
}

const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data : {
        name,
        email,
        password: hashedPassword,
        role: role || "USER" ,
         resetToken: " "              
        
      }
    })

  

    const token = generateToken(user.id);

    res.status(200).json({
      message: "User Register Successfully" , token , user:{
        id: user.id,
        email: user.email,
      },
    })

 }








