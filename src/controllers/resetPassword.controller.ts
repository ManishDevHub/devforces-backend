
import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import prisma from '../config/prisma';


export const resetPassword = async ( req: Request , res: Response) =>{

try{

 const { token , password} = req.body;

    if(!token || ! password){
        return res.status(400).json({
            message: " Token and password are required"
        })
    }
        const user = await prisma.user.findFirst({
            where:{
                resetToken: token,
                resetTokenExpires: {
                    gt: new Date(),
                }
            }
        })
        if(!user){
            return res.status(400).json({
                error: "Invalid or expire reset token "
            })
        }
        const hasedPassword = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: {id: user.id},
            data: {
                password: hasedPassword,
                resetToken: null,
                resetTokenExpires: null
            }
        })
        return res.status(200).json({
            message: "Password reset successfully"
        })

} catch(error){
    console.error("Reset password error: ", error)
    return res.status(500).json({ error: " server error while resetting password "})
}

   
    }
