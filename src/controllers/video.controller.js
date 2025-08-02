import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import mongoose from "mongoose";
import { getPublicIdFromUrl } from "../utils/getPublicIdFromUrl.js";
import { DeleteFromcloudinary,DeleteVideoFromCloudinary } from "../utils/OldImageDelete.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const pagenumber = parseInt(page);
    const limitnumber = parseInt(limit);

    const filter = { isPublished: true };
    if(!query && !userId) throw new ApiError(400, "Minimum one field is required");
    if (userId) {
        filter.owner = userId
    }
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }
    
    //sort videos
    const sortvideos = {
        [sortBy]: sortType === "asc" ? 1 : -1
    }

    //for total videos
    const totalVideos = await Video.countDocuments(filter);
    const videos = await Video.find(filter)
        .sort(sortvideos)
        .skip((pagenumber - 1) * limitnumber)
        .limit(limitnumber)
        .populate("owner", "username avatar createdAt")

    if (!videos) {
        throw new ApiError(500, "Something went wrong while fetching videos");
    }
    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            total: totalVideos,
            page: pagenumber,
            limit: limitnumber
        }, "Videos fetched successfully")
    );
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const user = req.user?._id
    // TODO: get video, upload to cloudinary, create video
    // Make sure both files are present
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) throw new ApiError(400, "Video or thumbnail file is missing");

    const video_up = await uploadOnCloudinary(videoLocalPath)
    const thumbnail_up = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail_up) throw new ApiError(401, "Something went wrong while uploading thumbnail on cloudinary")
    if (!video_up) throw new ApiError(401, "Something went wrong while uploading video on cloudinary")

    const video = await Video.create(
        {
            videoFile: video_up?.url,
            thumbnail: thumbnail_up?.url,
            title,
            description,
            duration: video_up.duration,
            owner: user
        }
    )
    if (!video) throw new ApiError(400, "Something went wrong while uploading on database")

     return res
     .status(200)   
     .json(new ApiResponse(200,video,"video uploaded succesfully"))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const videoExists = await Video.findById(videoId);
    if (!videoExists) throw new ApiError(404, "Video not found");

    const video = await Video.aggregate([
        {
            $match: {
                $and:[
                    {_id: new mongoose.Types.ObjectId(videoId)},
                    {isPublished:true}
                ]
                
            }
        },
        // Fetch total likes and check if current user liked it
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
                totallikes: { $size: "$likes" },
                isLiked: {
                    $in: [req.user?._id, { $map: { input: "$likes", as: "l", in: "$$l.likedBy" } }]
                }
            }
        },
        // Lookup owner details and their subscriber info
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "totalsubscriber"
                        }
                    },
                    {
                        $addFields: {
                            subscriberscount: { $size: "$totalsubscriber" },
                            issubscribed: {
                                $in: [req.user?._id, { $map: { input: "$totalsubscriber", as: "s", in: "$$s.subscriber" } }]
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscriberscount: 1,
                            issubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, video[0], "Video fetched successfully")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;
    const userid = req.user._id;
    if (!title && !description && !thumbnailLocalPath) throw new ApiError(400, "any one of data required for update");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "video with this id is not found");

    if (userid.toString() !== video.owner.toString()) throw new ApiError(403, "unauthorized user for update this video");

    if (thumbnailLocalPath) {
        const oldthumbnailId = video.thumbnail;

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if (!thumbnail) throw new ApiError(500, "Error while uploading the thumbnail");

        video.thumbnail = thumbnail.url;
        //for deletion
        const publicId = getPublicIdFromUrl(oldthumbnailId);
        const result = await DeleteFromcloudinary(publicId);
        if (result.result !== "ok") {
            throw new ApiError(401, "Some problem while deleting the thumbnail");
        }

    }

    video.title = title ? title : video.title;
    video.description = description ? description : video.description;

    await video.save({ validateBeforeSave: false });


    return res
        .status(200)
        .json(new ApiResponse(200, video, "video updated succesfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findById(videoId);
    if (!videoId) throw new ApiError(404, "video not found");

    if (req.user?._id.toString() !== video.owner.toString()) throw new ApiError(403, "unauthorized user to delete the video");

    const deleteVideo =await Video.findByIdAndDelete(videoId);

    const publicId = getPublicIdFromUrl(video.thumbnail);
    await DeleteFromcloudinary(publicId);
    const publicId2 = getPublicIdFromUrl(video.videoFile);
    await DeleteVideoFromCloudinary(publicId2);

    return res
        .status(200)
        .json(
            new ApiResponse(200, deleteVideo, "Video deleted")
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video=await Video.findById(videoId);
    const user=req.user._id;

    if(!video) throw new ApiError(404,"video not found");

    video.isPublished=video.isPublished===true ? false : true;
    await video.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(new ApiResponse(200,video, `${video.isPublished === true ? "Video published" : "Video unpublished"}`));

})


export {getAllVideos,deleteVideo,updateVideo,togglePublishStatus,getVideoById,publishAVideo};


