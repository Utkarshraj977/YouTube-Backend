import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    const channelstats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likescount: { $size: "$likes" }
            }
        },
        {
            $group: {
                _id: "$owner",  // keep owner id
                totalvideos: { $sum: 1 },
                totalviews: { $sum: "$views" },
                totallikes: { $sum: "$likescount" }
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id", // _id is owner here
                foreignField: "channel",
                as: "totalsubscribers"
            }
        },
        {
            $addFields: {
                subscriberscount: { $size: "$totalsubscribers" }
            }
        },
        {
            $project: {
                _id: 0,
                totalvideos: 1,
                totalviews: 1,
                totallikes: 1,
                subscriberscount: 1
            }
        }
    ]);

    res.status(200).json(
        new ApiResponse(200, channelstats[0] || {
            totalvideos: 0,
            totalviews: 0,
            totallikes: 0,
            subscriberscount: 0
        }, "Channel statistics fetched")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId=req.user?._id;
    const videos=await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                duration:1,
                views:1
            }
        }
    ])
    return res 
    .status(200)
    .json(new ApiResponse(200,videos,"channel video fetched succesfully"))
})

export {
    getChannelStats,
    getChannelVideos
}


