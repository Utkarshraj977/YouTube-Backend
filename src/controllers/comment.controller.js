import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { mongoose } from "mongoose";

//It is basic logic on the basis of populate
// const getVideosComments = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
//     const { page = 1, limit = 10 } = req.query
//     if (!videoId) throw new ApiError(404, "videoId not found")

//     const pagenumber = parseInt(page, 1)
//     const limitnumber = parseInt(limit, 10)
//     const skip = (pagenumber - 1) * limit

//     const comments = await Comment.find({ video: videoId })
//         .skip(skip)
//         .limit(limitnumber)
//         .populate("video like", "username email avatar likedBy")
//         .sort({ createdAt: -1 }) //to get new first

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 comments,
//                 "Comment fetched succesfully"
//             )
//         )
// })

//Based on aggregatepipelined


const getVideosComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    if (!videoId) throw new ApiError(404, "videoId not found")

    const pagenumber = parseInt(page, 10)
    const limitnumber = parseInt(limit, 10)
    const skip = (pagenumber - 1) * limit

    const options = {
        page,
        limit
    }
    const aggregatepipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "parentComment",
                as: "replies",
                pipeline: [
                    {
                        $sort: {
                            createdAt: -1
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
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
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likecount: {
                    $size: "$likes"
                },
                isliked: {
                    $in: [
                        new mongoose.Types.ObjectId(req.user?._id),
                        {
                            $map:
                            {
                                input: "$likes",
                                as: "like",
                                in: "$$like.likedBy"
                            }
                        }
                    ]
                }

            }
        }
    ]

    const comments = await Comment.aggregatePaginate(aggregatepipeline, options);
    if (!comments.docs || comments.docs.length === 0) {
        throw new ApiError(404, "No comments found");
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comments,
                "Comment fetched succesfully"
            )
        )
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId, parentComment } = req.params
    const { content } = req.body
    if (!videoId || !content) throw new ApiError(404, "videoId or content not found")

    const userid = req.user?._id
    const comment = await Comment.create(
        {
            content,
            video: videoId,
            owner: userid,
            parentComment: parentComment || null
        }
    )

    const iscreated = await Comment.findById(comment._id);
    if (!iscreated) {
        throw new ApiError(500, "something went wrong while creating comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "comment add succesfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body
    if (!commentId || !content) throw new ApiError(404, "videoId Or content not found")
    const user = req.user?._id

    const comment = await Comment.findById(commentId)
    if (!comment) throw new ApiError(404, "comment not found")
    if (comment.owner.toString() !== user.toString()) throw new ApiError(401, "unauthorized access")
    //Strings are primitive types in JavaScript. Primitive types (like string, number, boolean) are compared by value — not memory reference.
    comment.content = content
    await comment.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "comment updated succesfully"
            )
        )


})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const user = req.user?._id
    if (!commentId) throw new ApiError(404, "commentId Or content not found")
    const result = await Comment.findOneAndDelete({ _id: commentId, owner: user })
    if (!result) {
        throw new ApiError(500, "some problem while Deleting")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "message deleted successfully"
            )
        )

})

export { getVideosComments, addComment, updateComment, deleteComment }
