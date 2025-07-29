import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"

const getVideoComments = asyncHandler( async ( req, res ) =>
{
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VIdeo")
    }

    let pipeline = [
        { 
            $match: 
            { 
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
    ]

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        customLabels: {
            totalDocs: "total_comments",
            docs: "Comments"
        }
    }

    const allComments = await Comment.aggregatePaginate(pipeline, options)

    if (allComments?.total_comments === 0) {
        throw new ApiError(400, "Comments not found")
    }

    return res
    .status( 200 )
    .json(new ApiResponse(200, {"Comments": allComments, "size": allComments.length}, "Comments retrieved successfuly"))
} )

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Id")
    }

    const {content} = req.body

    if(!content || content.trim() === "") {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: new mongoose.Types.ObjectId( req.user?._id )
    })

    if(!comment) {
        throw new ApiError(400, "Failed to store the comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Commented Successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Id") 
    }

    if(!content || content.trim() === "") {
        throw new ApiError(400, "Content is required")
    }

     const comment = await Comment.findOne({
        _id: commentId,
        owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(400, "Comment not found")
    }

    comment.content = content

    await comment.save()

    return res
    .status(200)
    .json(new ApiResponse(200, {
            _id: comment._id,
            content: comment.content,
            owner: comment.owner,
            video: comment.video,
            updatedAt: comment.updatedAt
        }, "Comment Updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Id")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) { 
        throw new ApiError( 400, `No comment having id: ${commentId}`)
    }

    await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(new ApiResponse(200, null,"Comment deleted Successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }