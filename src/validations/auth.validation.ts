

import { email, parseAsync, z } from 'zod'

export const RegisterSchema = z.object({
    name : z.string().min(2 , "Name at least 4 character").max(15, "Name is to long"),
    email: z.email("Invalid email"),
    password: z.string().min(6 , " Password atleast 6 Character long").max(20, " password is to long"),
    role: z.enum(["USER" , "ADMIN"]).default("USER")
});

export const VerifyOtpSchema = z.object({
    userId : z.string().uuid("Invalid User Id"),
    opt : z.string().length(6 , " Otp must be 6 digit")
});



export const LoginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6 , "Password must be 6 character long").max(20, "Password is to long")
})
