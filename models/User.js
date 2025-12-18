import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:[true, 'please provide a username'],
        unique:true,
        trim:true,
        minLenght:[3, "must be at least 3 characters long"]
    },
    email:{
        type:String,
        required:[true, 'please provide an email'],
        unique:true,
        lowercase:true,
        match:[/^\S+@\S+\.\S+$/, 'please provide a valid email']
    },
    password:{
        type:String,
        required:true,
        minLength:[6, 'password must be at least 6 characters long'],
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
userSchema.pre("save",async function (){
    if(!this.isModified('password')){
        return 
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password,salt)
})

// compare password method 

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};






const User = mongoose.model("User", userSchema)
export default User