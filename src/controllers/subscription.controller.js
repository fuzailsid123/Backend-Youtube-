import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel Id")
    }

    const subscriber = req.user._id.toString()

    if (subscriber === channelId) {
        throw new ApiError(400, "You cannot subscribe to yourself")
    }


    const channel = await User.findById(channelId)

    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriber,
        channel: channelId,
    })

    if (existingSubscription) {
        await existingSubscription.deleteOne();

        return res
        .status(200)
        .json(new ApiResponse(200, null, `Unsubscribed from ${channel.username}`))
    } else {
        const newSubscription = await Subscription.create({
        subscriber: subscriberId,
        channel: channelId,
        })

        return res
        .status(200)
        .json(new ApiError(200, newSubscription, `Subscribed to ${channel.username}`))
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel Id")
    }
    
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const subscribers = await Subscription.find({ channel: channelId }).populate(
        "subscriber",
        "username fullname"
    );

    return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Channel subscribers retrieved successfully"))

})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber ID");
    }

    const user = await User.findById(subscriberId);
    if (!user) {
        throw new ApiError(404, "Subscriber not found");
    }

    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate(
        "channel",
        "username fullname avatar"
    );

    const subscribedChannels = subscriptions.map((sub) => sub.channel);

    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels retrieved successfully")
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}