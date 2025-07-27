import mongoose from "mongoose"
import jwt from "jsonwebtoken" //used to securely create and verify tokens that transmit data between parties 
import bcrypt from "bcrypt"  // used in password hashing


const userSchema = mongoose.Schema({
    watchHistory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Videos"
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,
        required: true
    },
    coverImage: {
        type: String
    },
    password: {
        type: String,
        unique: true,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }
}, {timestamps: true})

userSchema.pre("save", async function(next) { // This is a Mongoose middleware hook that runs before saving a user
    if(!this.isModified("password") ) return next(); // Only hash the password if it's new or changed
    this.password = await bcrypt.hash(this.password, 10) // Hash the password with a salt round of 10 (more secure) and this.password Replace the plain-text password with the hashed version before saving
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) { // userSchema.methods is used to add custom method to each document in mongoose 
    return await bcrypt.compare(password, this.password) // 'this.password' refers to the hashed password stored in the document
}

userSchema.methods.generateAccessToken = function(){
    // console.log("EXPIRY (raw):", JSON.stringify(process.env.ACCESS_TOKEN_EXPIRY));
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User", userSchema)