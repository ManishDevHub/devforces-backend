import { Request , Response,NextFunction } from "express";
import { AuthRequest } from "./auth";

export const isAdmin =  (req : AuthRequest, res: Response , next: NextFunction) =>{
    if(req.user?.role !== "ADMIN"){
        return res.status(403).json({message: "Access denied : ADMIN only"})
    }
    next();
}