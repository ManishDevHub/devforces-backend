

import  { z }  from 'zod'

export const registerSchema = z.object({
    name: z.string().min(3 , "username atleast 3 charater").max(20, "username is to long"),
    email: z.string().email("Invalid Email"),
    password: z.string().min(6 , "Password atleast 6 charater long").max(20, "Password is to long"),
    role: z.enum(["USER" , "ADMIN"]).optional()

})

export const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(3).max(20)
})

export const forgotPasswordSchema = z.object({
    email: z.string().email()
})

export const resetPasswordSchema = z.object({
    password: z.string().min(6, "Password is to small").max(20, "Password is to long")
})
