import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function protect(req,res,next){

    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            message:"Unauthorized"
        });
    }

    const token = authHeader.split(" ")[1];

    try{
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.contactid = decoded.id;

        next();

    }catch(err){
        return res.status(401).json({
            message:"Invalid or expired token"
        });
    }
}