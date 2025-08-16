import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Check if already liked
    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    let message;
    let result = null;

    if (existingLike) {
        await Like.findOneAndDelete({ video: videoId, likedBy: userId });
        message = "Unliked successfully";
    } else {
        result = await Like.create({ video: videoId, likedBy: userId });
        message = "Liked successfully";
    }

    return res.status(200).json(
        new ApiResponse(200, result, message)
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    const userId = req.user?._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    // Check if already liked
    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

    let message;
    let result = null;

    if (existingLike) {
        await Like.findOneAndDelete({ comment: commentId, likedBy: userId });
        message = "Unliked successfully";
    } else {
        result = await Like.create({ comment: commentId, likedBy: userId });
        message = "Liked successfully";
    }

    return res.status(200).json(
        new ApiResponse(200, result, message)
    );

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    const userId = req.user?._id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    // Check if already liked
    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    let message;
    let result = null;

    if (existingLike) {
        await Like.findOneAndDelete({ tweet: tweetId, likedBy: userId });
        message = "Unliked successfully";
    } else {
        result = await Like.create({ tweet: tweetId, likedBy: userId });
        message = "Liked successfully";
    }

    return res.status(200).json(
        new ApiResponse(200, result, message)
    );

})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id

    const AllLikedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    },
                    {
                        $project: {
                           
                            username: "$ownerDetails.username",
                            fullname: "$ownerDetails.fullname",
                            avatar: "$ownerDetails.avatar"
                            
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $project: {
                _id: 0,
                videoId: "$videoDetails._id",
                title: "$videoDetails.title",
                description: "$videoDetails.description",
                thumbnail: "$videoDetails.thumbnail",
                duration: "$videoDetails.duration",
                isPublished: "$videoDetails.isPublished",
                likedAt: "$createdAt",
                username:"$videoDetails.username",
                fullname:"$videoDetails.fullname",
                avatar:"$videoDetails.avatar"
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, AllLikedVideos, "all liked videos fetched"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}

