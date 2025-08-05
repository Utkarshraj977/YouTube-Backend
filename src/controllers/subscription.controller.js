import mongoose, { isValidObjectId, mongo } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    const userId = req.user?._id;
    
    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400,"Invalid channelid")
    }
    const existSubscription=await Subscription.findOne({
        channel:new mongoose.Types.ObjectId(channelId),
        subscriber:userId
    });

    let mess=""
    if(existSubscription){
        await existSubscription.deleteOne();
        mess="unsubscribed successfully"
    }else{
        await Subscription.create(
            {
                subscriber:userId,
                channelId:new mongoose.Types.ObjectId(channelId)
            }
        );
        mess="subscribed succesfully"
    }


    return res
    .status(200)
    .json(new ApiResponse(200,null,mess))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400,"channelId is not valid")
    }

    const subscribers=await Subscription.find({channel:channelId})

    if (!subscribers || subscribers.length === 0) {
        throw new ApiError(404, "No subscribers found");
    }
    const subscriberId=subscribers.map(item=>item.subscriber)

    return res
    .status(200)
    .json(new ApiResponse(200,subscriberId,"All subscribers fetched succesfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!mongoose.Types.ObjectId.isValid(subscriberId)){
        throw new ApiError(400,"subscriberId is wrong")
    }

    const subscribedchannel=await Subscription.aggregate([
        {
             $match:{
               subscriber:mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channelDetails"
            }
        },
        { 
            $unwind: "$channelDetails" 
        },
        {
            $replaceRoot: {
                newRoot: "$channelDetails"
            }
        },
        {
            $project:{
                username:1,
                fullname:1,
                avatar:1,
                coverImage:1   
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200,subscribedchannel,"channelId fetched succesfully"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
