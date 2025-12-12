import jwt from "jsonwebtoken";
import User from "../models/User.js"

// generate JWT 
const generateToken = (id) => {
    return jwt.sign({id}), process.env.JWT_SECRET, {
        expiresIn:process.env.JWT_EXPIARY || "7d"
    }
}

// @desc Register new User 
// @route POST /api/auth/register
// @access PUBLIC 

export const register = async (req,res,next) => {
    try {
        const {username,email,password} = req.body; 
        // check if user exists
        const userExists = await user.findOne({$or: [{email}, {username}]});
        if(userExists) {
            return res.status(400).json({
                success: false,
                error:
                userExists.email === email
                ? "Email already exists"
                : "Username already taken"
            })
        }

        // create user 
        const user = await user.create({
            username,
            email,
            password
        });

        // generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data:{
                user:{
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
                },
                token
            },
            message: "User registered successfully"
        },
    )

    } catch (error) {
        next(error)
    }
}


// @desc login  User 
// @route POST /api/auth/login
// @access PUBLIC 

export const login = async (req,res,next) => {
    try {
        const {email, password} = req.body;

        // validate input
        if(!email || !password){
            return res.status(400).json({
                success:false,
                error:"Please provide email and password",
                statusCode:400,
            })
            // check for user [include password for corrcetion]
            const user = await User.findOne({email}).select("+password")

            if(!user){
                return res.status(401).json({
                    success:false,
                    error:"invalid credentials",
                    statusCode:401,
                })
            }

            // check password
            const isMtach = await user.matchPassword(password);

            if(!isMatch){
                return res.status(401).json({
                    success:false,
                    error:"invalid credentials",
                    statucCode:401,
                })
            }

            // generate token 
            const token = generateToken(user._id);

            res.status(200).json({
                success:true,
                user:{
                    id:user._id,
                    username:user.username,
                    email:user.email,
                    profileImage:user.profileImage,
                },
                token,
                message:"login sucessfull"
            })
        }
    } catch (error) {
        next(error)
    }
}


// @desc get user profile
// @route POST /api/auth/profile
// @access private

export const getProfile = async (req,res,next) => {
    try {
        const user = await User.findById(req.user._id)
        res.statud(200).json({
            success:true,
            data:{
                id:user._id,
                username:user.username,
                email:user.email,
                profileImage:user.profileImage,
                createdAt:user.createdAt,
                updatedAt:user.updatedAt,
            }
        })
    } catch (error) {
        next(error)
    }
}

// @desc update user profile
// @route POST /api/auth/profile
// @access private

export const updateProfile = async (req,res,next) => {
    try {
        const {username, profileImage, email} = req.body;
        const user = await User.findById(req.user._id)
        
        if(username) user.username = username;
        if(email) user.email = email;
        if(profileImage) user.profileImage = profileImage

        await user.save()

        return res.status(200).json({
            success:true,
            data:{
                id:user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage
            },
            message:"profile updated successfully"
        })

    } catch (error) {
        next(error)
    }
}

// @desc change password
// @route POST /api/auth/change-password
// @access private

export const changePassword = async (req,res,next) => {
    try {
        const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Please provide current and new password",
        statusCode: 400,
      });
    }

    // Find user by ID and include password field
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        statusCode: 404,
      });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
        statusCode: 401,
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      statusCode: 200,
    });
    } catch (error) {
        next(error)
    }
}

