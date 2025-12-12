import jwt from "jsonwebtoken";
import User from "../models/User.js"

const protect = async (req,res,next) => {
    let token;

    // check for token in authorization header
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        try {
            token = req.headers.authorization.split(" ")[1];

            // verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password")

            if(!req.user){
                return res.status(401).json({
                    success:false,
                    error:"user not found",
                    statusCode:401
                })
            }

            next();

        } catch(error){
            console.error("Auth middleware error:", error.message);
            if(error.name === "TokenExpiredError"){
                res.status(401).json({
                    success:false,
                    error:"Token expired",
                    statusCode:401
                })
            }
            return res.status(401).json({
                success:false,
                error: 'No Authorized, token failed',
                statusCode:401
            })
        }
    }
    if(!token){
        return res.status(401).json({
            success:false,
            error:"No authorized, no token",
            statusCode:401,
        })
    }
}

export default protect