import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { DeleteFromcloudinary } from "../utils/OldImageDelete.js";
import { getPublicIdFromUrl } from "../utils/getPublicIdFromUrl.js"
//import { use } from "react"
import mongoose from "mongoose"


//import {isPasswordCorrect} from "../models/user.model.js"

const generateAccessandRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (err) {
        throw new ApiError(500, "something went wrong when generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    //get user details from frontend or postman
    //validation-not empty
    //check if user allready register:-by email and username
    //upload them to cloudinary,avatar
    //create user object-create entry in db
    //remove password AND refreshtoken field from response
    //check for user creation
    //return res

    const { fullname, email, username, password } = req.body;

    if (email === "") {
        throw new ApiError(400, "email is required")
    }
    if (username === "") {
        throw new ApiError(400, "username is required")
    }
    if (password === "") {
        throw new ApiError(400, "password is required")
    }
    if (fullname === "") {
        throw new ApiError(400, "fullname is required")
    }
    // if(
    //     [fullname,email,username,password].some((field)=>field?.trim() ==="")
    // ){
    //     throw new ApiError(400,"Allfield is required")
    // }

    const existuser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existuser) {
        throw new ApiError(409, "email or username allready exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;  //because coverImage is not required property so 
    //if user not give coverImage then server have to register without coverimage but there is no handle case so we handle this in next line code

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    let coverImage = null
    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createduser) {
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createduser, "user registered succesfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    //get user details email or username and password
    //validation not empty
    //validate from server is the email and password correct 
    //send a access and refresh token
    console.log(req.body);
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(404, "password is incorrect")
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "user Logged in succesfully"
            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // $set: {
            //     refreshToken: undefined
            // }
            $unset: {
                refreshToken: 1// this removes the field from document
            }

        },
        {
            new: true
        }

    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user loggedOut succesfully"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "RefreshToken is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access Token refreshed"

                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldpassword, newpassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newpassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed succesfully"))


})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched succesfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(400, "All Fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        }, {
        new: true
    }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account Details Updated succesfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "avatar updated Seccesfully")
        )
})

const updateUsercoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)  //coverImage is a object which have url,public_url,resorce_type

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const currentUser = await User.findById(req.user._id);
    const oldImageUrl = currentUser.coverImage;

    const user = await User.findByIdAndUpdate( //findByIdAndUpdate() takes three arguments (not a function):
        req.user?._id,                    // 1️⃣ ID of the user to update
        {
            $set: {
                coverImage: coverImage.url
            }
        },                                // 2️⃣ Update operations
        { new: true }   //without this mongoose give previous data so after writing this return updated document                  // 3️⃣ Options
    ).select("-password")                // Exclude password from final result


    //delete old image
    const publicId = getPublicIdFromUrl(oldImageUrl);
    const result = await DeleteFromcloudinary(publicId);
    console.log(result);

    if (result.result !== "ok") {
        throw new ApiError(401, "Some problem while deleting");
    }


    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover Image updated Seccesfully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "channel detail fetched succesfully")
        )
})

const getwatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }

        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "watch History fetched succesfully"
            )
        )

})




export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentPassword, updateAccountDetails, updateUserAvatar, updateUsercoverImage, getUserChannelProfile, getwatchHistory }


