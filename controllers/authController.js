import jwt from "jsonwebtoken";
import user from "../models/User.js"

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
        
    } catch (error) {
        next(error)
    }
}


// @desc login  User 
// @route POST /api/auth/login
// @access PUBLIC 

export const login = async (req,res,next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}


// @desc get user profile
// @route POST /api/auth/profile
// @access private

export const getProfile = async (req,res,next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}

// @desc update user profile
// @route POST /api/auth/profile
// @access private

export const updateProfile = async (req,res,next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}

// @desc change password
// @route POST /api/auth/change-password
// @access private

export const chnagePassword = async (req,res,next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}