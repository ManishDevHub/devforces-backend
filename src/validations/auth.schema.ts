
import { PassThrough } from 'stream'
import  { email, z }  from 'zod'

export const registerSchema = z.object({
    username: z.object({
        firstName: z.string().min(3 , "first Name atleast 2 charaters").max(10 ," first Name is to long"),
        lastName: z.string().min(3, " LastName atleast 3 Charaters").max(10 , "LastName is to long")
    }),
    email: z.string().email("Invalid Email"),
    password: z.string().min(6 , "Password atleast 6 charater long").max(20, "Password is to long"),
    role: z.enum(["USER" , "ADMIN"]).optional()

})

export const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    Password: z.string().min(3).max(20)
})

export const forgotPasswordSchema = z.object({
    email: z.string().email()
})

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, "Password is to small").max(20, "Password is to long")
})
