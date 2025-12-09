import { error } from "console";
import { Request , Response, NextFunction } from "express";
import {  ZodSchema } from "zod";


export const validate = (schema: ZodSchema) =>
(req: Request , res: Response , next : NextFunction) =>{
    try{
        const result = schema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({
                message: "Validation Failed",
                errors: result.error.flatten()
            })} 
            
            req.body  = result.data
            next();
        
    }catch(err : unknown){
        
            console.log("Validaton middleware error", error)
            return res.status(500).json({
        message: "Internal Server Error",
        error: err instanceof Error ? err.message : err,
      });

    }
}