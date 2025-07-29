import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    const userId = req.user._id

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Id")
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if(userId.toString() === video.owner.toString()) {
        throw new ApiError(400, "You cannot like your own video")
    }

    const like_exist = await Like.findOne({
        video: videoId,
        likedBy: userId 
    })

    if(like_exist) {
        await like_exist.deleteOne()

        return res.status(200).json(new ApiResponse(200, null, "Unliked The video"))
    }else {
        const like = await Like.create({
            video: videoId,
            likedBy: userId
        })

        return res
        .status(200)
        .json(new ApiResponse(200, like, "Video liked Successfully"))
    }


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Id")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if(userId.toString() === comment.owner.toString()) {
        throw new ApiError(400, "You cannot like your own comment")
    }

    const like_exist = await Like.findOne({
        comment: commentId,
        likedBy: userId 
    })

    if(like_exist) {
        await like_exist.deleteOne()

        return res.status(200).json(new ApiResponse(200, null, "Unliked The comment"))
    }else {
        const like = await Like.create({
            comment: commentId,
            likedBy: userId
        })

        return res
        .status(200)
        .json(new ApiResponse(200, like, "Comment liked Successfully"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Id")
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if(userId.toString() === tweet.owner.toString()) {
        throw new ApiError(400, "You cannot like your own tweet")
    }

    const like_exist = await Like.findOne({
        tweet: tweetId,
        likedBy: userId 
    })

    if(like_exist) {
        await like_exist.deleteOne()

        return res.status(200).json(new ApiResponse(200, null, "Unliked The Tweet"))
    }else {
        const like = await Like.create({
            tweet: tweetId,
            likedBy: userId
        })

        return res
        .status(200)
        .json(new ApiResponse(200, like, "Tweet liked Successfully"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const {likedBy} = req.params
    const userId = req.user._id

    if(!isValidObjectId(likedBy)) {
        throw new ApiError(400, "Invalid Id")
    }

    if(userId.toString() !== likedBy.toString()) {
        throw new ApiError(400, "Only users are allowed to see their likes")
    }

    const likedVideos = await Like.find({
        likedBy: likedBy,
        video: { $ne: null },
    }).populate("video");

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos retrieved successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}