
import { Response , NextFunction } from "express";
import { AuthRequest } from "./auth";

export const isUser = (req: AuthRequest, res: Response , next: NextFunction)=>{

    if(req.user?.role !== "USER"){
        return res.status(403).json({message: "Access denied: USER only"});
    }
next();
    
}