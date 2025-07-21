import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser= asyncHandler(async (req,res)=>{
   
    //get user details from frontend or postman
    //validation-not empty
    //check if user allready register:-by email and username
    //upload them to cloudinary,avatar
    //create user object-create entry in db
    //remove password AND refreshtoken field from response
    //check for user creation
    //return res

    const {fullname,email,username,password}=req.body;

    if(email === ""){
        throw new ApiError(400,"email is required")
    }
    if(username === ""){
        throw new ApiError(400,"username is required")
    }
    if(password === ""){
        throw new ApiError(400,"password is required")
    }
    if(fullname === ""){
        throw new ApiError(400,"fullname is required")
    }
    // if(
    //     [fullname,email,username,password].some((field)=>field?.trim() ==="")
    // ){
    //     throw new ApiError(400,"Allfield is required")
    // }

    const existuser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existuser){
        throw new ApiError(409,"email or username allready exist")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage?.[0]?.path;  //because coverImage is not required property so 
    //if user not give coverImage then server have to register without coverimage but there is no handle case so we handle this in next line code

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    let coverImage=null
    if(coverImageLocalPath){
        coverImage=await uploadOnCloudinary(coverImageLocalPath)
    }
    
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "", 
        email,
        password,
        username:username.toLowerCase()
    })
    const createduser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createduser){
        throw new ApiError(500,"something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createduser,"user registered succesfully")
    )

})

export {registerUser}


