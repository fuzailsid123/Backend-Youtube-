import mongoose, {isValidObjectId} from "mongoose"
import mongooseAggregatePaginate  from "mongoose-aggregate-paginate-v2"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"

 
const getAllVideos = asyncHandler(async (req,res) =>
{
    const{page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = 1, userId = "" } = req.query // Get the page, limit, query, sortBy, sortType, userId from the request query

    let pipeline = [
        {
            $match: {
                $and: [ // When both the the conditions met then it will exexcute
                    {
                        //match the videos based on title and description
                        $or: [
                            {title: {$regex:query, $options: "i" }},   // $regex: is used to search the string in the title -> $options used in conjunction with it = i is for case-insensitive
                            {description: {$regex:query, $options: "i"}}
                        ]
                    },
                    // mongoose.Types.ObjectId( userId ) -> converting string(userId) into mongoose objectId so we can match with the owner field 
                    ...(userId ? [ { Owner: new mongoose.Types.ObjectId( userId ) } ] : [])  //- This ensures that only documents where the Owner field matches the given userId are included.

                ]
            }
        },

        { 
            $lookup: { // joining the videos collection with the users collection on the basis of _id, finds the corresponding user document where users._id === videos.Owner
                from: "users",
                localField: "Owner",  
                foreignField: "_id",
                as: "Owner", // result is added as an array in the Owner of the resulting video document
                pipeline: [ // additional projecting
                    {
                        $project: { // Specifies which field from the users to include in Owner(result)
                            _id: 1,
                            fullName: 1,
                            avatar: "$avatar.url",
                            username: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                Owner: {
                    $first: "$Owner", //Take first element from the Owner array from lookup
                },
            },
        },
        {
            $sort: { [sortBy]:sortType }  // Sorting according on the basis of createdAt in ascending order
        }
    ];

    try
    {
        const options = { 
            page: parseInt(page),
            limit: parseInt(limit),
            customLabels: { 
                totalDocs: "totalVideos",
                docs: "video",
            },
        };

        const result = await Video.aggregatePaginate( Video.aggregate( pipeline ), options);  // Video.aggregate( pipeline ) find the videos based on pipeline defined above . // aggregatePaginate is used for pagination (page, limit)

        if ( result?.videos?.length === 0 ){ 
            throw new ApiError( 404, "No Videos Found" ) 
        }

        return res
        .status(200)
        .json(new ApiResponse( 200, result, "Videos fetched successfully" ));

    } catch (error)
    {
        console.error( error.message );
        throw new ApiError(500, "Internal Server Error")
    }
})

const publishAVideo = asyncHandler(async (req,res) =>
{
    try
    {        
        const {title, description} = req.body // accessing title and description from reqruest body
        if ( [title, description].some((field) => field.trim() === "")){  
            throw new ApiError( 400, "Please provide all details" ) 
        }

        // uploading video and thumbnail to loacl storage and get the path
        const videoLocalPath = req.files?.videoFile[0]?.path
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path

        if (!videoLocalPath) { 
            throw new ApiError(400, "Video File is required") 
        }

        if (!thumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail is required")
        }

        // uploading video and thumbnail to cloudinary 
        const Video = await uploadOnCloudinary(videoLocalPath)
        const Thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if (!Video) {
            throw new ApiError(400, "Failed to upload the video")
        }

        if (!Thumbnail) {
            throw new ApiError(400, "Failed to upload the thumbnail") 
        }


        // create a video document in the database
        const video = await Video.create( {
            title: title,
            description: description,
            thumbnail: Thumbnail?.url,
            videoFile: Video?.url,
            duration: Video?.duration,
            isPUblished: true,
            Owner: req.user?._id
        } )

        if (!video) {
            throw new ApiError(400, "video Uploading failed")
        }

        return res
        .status(200)
        .json(new ApiResponse(201, video, "Video Uploaded successfully"))

    } catch ( error )
    {
        console.error( error.message );
        throw new ApiError(500, "Internal Server Error")
    }
})

const getVideoById = asyncHandler(async (req,res) =>
{
    try
    {
        const {videoId} = req.params

        if (!isValidObjectId(videoId)){
            throw new ApiError( 400, "Invalid ID" ) 
        }

        const video = await Video.findById(videoId) // finding video on the basis of id

        if (!video) {
            throw new ApiError( 400, `The video having id: ${videoId} is not found` )
        }

        return res.
        status(200)
        .json(new ApiResponse(200, video, "Video found"))

    } catch ( error )
    {
        res.status( 501 )
            .json( new ApiError( 501, {}, "Internal Server Error" ) )
    }
} )

const updateVideo = asyncHandler(async (req,res) =>
{
    try
    {
        const {videoId} = req.params

        if (!isValidObjectId(videoId)) { 
            throw new ApiError(400, `There is no video having id: ${videoId}`)
        }

        const { title, description } = req.body
        if ([title, description].some((field) => field.trim() === "")) {
            throw new ApiError( 400, "Title and description is required")
        }

        const video = await Video.findById(videoId)

        if (!video) {
             throw new ApiError(400,"Video not found")
            }

        if (!video.Owner.equals(req.user._id)) {  // Checking if the video belongs to the loggedIn user
            throw new ApiError(400, "You are not the owner of this video")
        }

        const thumbnail = req.file?.path

        if (!thumbnail) {
            throw new ApiError(400,"Thumbnail not found")
        }

        const oldThumbnailUrl = video.thumbnail;
        const segments = oldThumbnailUrl.split("/");
        const publicIdWithExtension = segments[segments.length - 1];
        const publicId = publicIdWithExtension.split(".")[0]; 

        await deleteFromCloudinary(publicId);

        const newThumbnail = await uploadOnCloudinary(thumbnail)
        
        if (!newThumbnail) {
            throw new ApiError(400, "Thumbnail has not been Updated")
        }

        video.title = title
        video.description = description
        video.thumbnail = newThumbnail.url
        await video.save()

        return res
        .status(200)
        .json(new ApiResponse(200, video, "Success! Video details has been updated"))

    } catch ( error ){
        console.error( error.message );
        throw new ApiError(500, "Internal Server Error")
    }
} )

const deleteVideo = asyncHandler( async ( req, res ) =>
{
    const {videoId} = req.params

    if (!isValidObjectId(videoId)){ 
        throw new ApiError( 400, "Invalid VideoID")
    }

    const video = await Video.findById( videoId )
    if (!video){ 
        throw new ApiError( 400, `No Video having id: ${videoId}`)
    }

    if (!video.Owner.equals(req.user._id)){ 
        throw new ApiError( 403, "You are not authorized to delete this video")
    }

    const extractPublicId = (url) => {
        const segments = url.split("/");
        const lastSegment = segments[segments.length - 1];
        return lastSegment.split(".")[0];
    };

    const thumbnailPublicId = extractPublicId(video.thumbnail);
    const videoPublicId = extractPublicId(video.videoUrl);

    await deleteFromCloudinary(thumbnailPublicId);
    await deleteFromCloudinary(videoPublicId, "video");

    await video.deleteOne();


    await video.remove();  // .remove dont work with findOne it only works with findById 

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Deleted successfully"))
} )

const togglePublishStatus = asyncHandler(async(req,res) =>
{
    const { videoId } = req.params

    if (!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid VideoID")
    }

    const toggleisPublished = await Video.findOne(    // findOne will check _id AND Owner both should match instead of using findById it only check _id 
        {
            _id: videoId,
            Owner: req.user._id,
        },
    );

    if (!toggleisPublished){
        throw new ApiError(400, "Invalid Video or Owner")
    }

    // 3. toggle the isPUblished field of the video document
    toggleisPublished.isPublished = !toggleisPublished.isPublished

    await toggleisPublished.save()

    return res
    .status(200)
    .json(new ApiResponse(200, toggleisPublished.isPUblished, "isPUblished toggled successfully" ) )
} )

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}