import { Request, Response } from "express";
import  prisma   from '../config/prisma'
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import { Role } from "../generated/prisma/enums";





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
         resetToken: ""              
        
      }
    })
    res.status(200).json({
      message: "User Register Successfully"  , user:{
        id: user.id,
        email: user.email,
      },
    })

 }


 export const login = async (req: Request , res: Response) =>{

  try{

    const { email , password} = req.body;

    const user = await prisma.user.findUnique({ where: { email }})

    if(! user){
      return res.status(400).json({mess: "Invalid email or Password"})
    }

    const isMatch = await bcrypt.compare(password , user.password);

    if(!isMatch){
      return res.status(400).json({ message: "Invalid email or Password"})
    }

const token = generateToken(user.id );
res.status(200).json({
  message: " User Login successfully",
   token ,
  user: {
    name: user.name,
    id : user.id,
    email: user.email,

    
  }
})
 
  }catch(error){
    console.error(error)
    return res.status(500).json({ message:"Server error"})
  }
 }








