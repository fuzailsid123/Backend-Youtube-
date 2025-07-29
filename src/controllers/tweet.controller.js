import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required")
    }

    const postTweet = await Tweet.create({
        owner: req.user?._id,
        content: content,
    } )

    if ( !postTweet ){
        throw new ApiError(400, "Tweet not posted!")
    }

    return res
    .status( 200 )
    .json(new ApiResponse(200, postTweet, "Tweet Posted!"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const tweets = await Tweet.findById({owner: userId})

    if(tweets.length === 0) {
        throw new ApiError(404, `No tweets for user having id: ${userId}`)
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets retrieved successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {tweetId} = req.params

    if(!content || content.trim() === "") {
        throw new ApiError(400, "Content is required for the tweet")
    }

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet Id")
    }

    const tweet = await Tweet.findById(tweetId);
    
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    tweet.content = content

    return res
    .status(200)
    .json(new ApiResponse(200, tweet.content,"Tweet has been updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    if(!tweet) {
        throw new ApiError(404,"Tweet not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet has been deleted"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}