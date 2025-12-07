
import jwt from 'jsonwebtoken'




interface AuthRequest extends Request {
    user? :{
        id : string,
        role: string

    }
}

export const userAuth = async (req: Request, res : Response) => {

  
}