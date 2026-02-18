import e, { Request, Response } from "express";
import  prisma   from '../config/prisma'
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'

import {  AuthRequest  } from "../middlewares/auth";
import { uploadCloToBinary } from "../utils/cloudinaryUpload";
import cloudinary from "../config/cloudinary";

const JWT_SECRET = process.env.JWT_SECRET || "sdddsdsgsgsgs";
const generateToken = (id: string, role:string) => {
  return jwt.sign({ id , role }, JWT_SECRET, { expiresIn: "7d" });
};

 export const register =  async (req: Request, res: Response) =>{
const { name , email , password , role} = req.body;

const existingUser = await prisma.user.findUnique({
  where:{email}
})

if(existingUser){
  return res.status(400).json({
    message: " Email already exists"
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
      message: " Register Successfully"  , user:{
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
      return res.status(400).json({message: "Invalid email or Password"})
    }

    const isMatch = await bcrypt.compare(password , user.password);

    if(!isMatch){
      return res.status(400).json({ message: "Invalid email or Password"})
    }

const token = generateToken(user.id , user.role);
res.status(200).json({
  message: " Login successfully",
   token ,
  user: {
    name: user.name,
    id : user.id,
    email: user.email,
    role: user.role

    
  }
})
 
  }catch(error){
    console.error(error)
    return res.status(500).json({ message:"Server error"})
  }
 }



 export const getProfile = async ( req: AuthRequest, res: Response) => {

  try{

    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate stats
    const solvedCount = await prisma.submission.groupBy({
      by: ["problemId"],
      where: {
        userId,
        status: "ACCEPTED",
      },
    });
    
    const totalProblems = await prisma.problem.count();

    res.json({
        ...user,
        solvedProblems: solvedCount.length,
        totalProblems,
    });

  } catch(error){
    console.error(error);

    res.status(500).json({message: "Failed to load profile"});
  }
 }


export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : undefined;
    const bio = typeof req.body.bio === "string" ? req.body.bio.trim() : undefined;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let avatarUpdate:
      | {
          avatar: string;
          avatarPublicId: string;
        }
      | undefined;

    if (req.file) {
      if (existingUser.avatarPublicId) {
        await cloudinary.uploader.destroy(existingUser.avatarPublicId);
      }

      const uploaded = await uploadCloToBinary(
        req.file.buffer,
        "user_avatars",
        `user_${userId}`
      );

      avatarUpdate = {
        avatar: uploaded.url,
        avatarPublicId: uploaded.publicId,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(avatarUpdate || {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    return res.json({
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};


export const getUserCalendar = async ( req: AuthRequest, res: Response) =>{

  try{

    const userId = req.user.id;

    const activity = await prisma.activity.findMany({
      where: { userId},
      orderBy:{ date: "asc"},
      select:{
        date: true,
        count: true,
      }
    })

    if(!activity){
      return res.status(404).json({ message: " Something went wrong"});
    }

    res.json(activity);

  }catch( error) {
    console.error(" Calendar error", error)
     res.status(500).json({ message: " Server error"});
  }
}
