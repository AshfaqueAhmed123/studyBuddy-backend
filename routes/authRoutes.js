import express from "express"
import {body} from "express-validator"
import {

    register,
    login,
    getProfile,
    updateProfile,
    changePassword

} from "../controllers/authController.js"
import protect from "../middleware/auth.js"

const router = express.Router()

const registerValidation = [
    body("username").trim().isLength({min:3}).withMessage('Username must be atleast 3 characters'),
    body("email").isEmail().normalizeEmail().withMessage('please provide a valid email'),
    body("password").isLength({min:6}).withMessage("password must be at least 6 characters")
]

const loginValidation = [
    body("email").isEmail().normalizeEmail().withMessage('please provide a valid email'),
    body("password").notEmpty().withMessage('password is required')
]

// public routes
router.route("/register",registerValidation,register)
router.route("/login",loginValidation,login)

// protected routes 
router.route("/profile", protect, getProfile) 
router.route("/profile", protect, updateProfile)
router.route("/change-password", protect, changePassword)

export default router;
