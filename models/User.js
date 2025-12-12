import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:[true, 'please prvide a username'],
        unique:true,
        trim:true,
        minLenght:[3, "must be atleast 3 characters long"]
    },
    email:{
        type:String,
        required:[true, 'please prvide an email'],
        unique:true,
        lowercase:true,
        match:[/^\S+@\S+\.\S+$/, 'please provide a valid email']
    },
    password:{
        type:String,
        required:true,
        minLength:[6, 'password must be atleast 6 characters long'],
        select:false,
    },
    profileImage:{
        type:String,
        default:null
    }
},{
    timestamps:true
})


// hash password before save 
userSchema.pre("save",async function (next){
    if(!this.isModified('password')){
        next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password,salt)
})

// compare password method 

userSchema.methods.matchPassword = async (enteredPassword) => {
    return await bcrypt.compare(enteredPassword,this.password)
}






const User = mongoose.model("User", userSchema)
export default User