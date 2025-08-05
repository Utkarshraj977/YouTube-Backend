import mongoose from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    if (!content) throw new ApiError(400, "content required for create tweet");
    const user = req.user._id;
    const tweet = await Tweet.create({
        content,
        owner: user
    });
    if (!tweet) throw new ApiError(400, "something went wrong while creating tweet");

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "tweeted succesfully")
        )
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user?._id;
    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                avatar: "$owner.avatar",
                username: "$owner.username",
                fullname: "$owner.fullname"
            }
        }

    ]

    const tweets = await Tweet.aggregate(pipeline);

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "tweet is fetched succesfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params;
    const {content}=req.body;
    if(!content) throw new ApiError(404,"content required for updation")

    const tweet=await Tweet.findById(tweetId);
    if(!tweet) throw new ApiError(404,"tweet not found")
    
    if(tweet.owner.toString() !== req.user._id.toString()) throw new ApiError(401,"unauthorized to update this tweet")

    tweet.content=content
    await tweet.save({ validateBeforeSave: false });   

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"tweet update succesfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
    const userId = req.user._id;

    const tweet = await Tweet.findById({_id:tweetId});
    if (!tweet) throw new ApiError(400, "tweet not found");

    if (tweet.owner.toString() !== userId.toString()) throw new ApiError(401, "unauthorized user for delete this comment");

    const result = await Tweet.deleteOne(tweet);
    if (!result) {
        throw new ApiError(500, "some problem while Deleting tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "tweet delete succesfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
