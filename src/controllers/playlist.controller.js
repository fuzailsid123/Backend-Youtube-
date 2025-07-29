import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asynchandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description, videos} = req.body

    if(!name || name.trim() === "") {
        throw new ApiError(400, "Name is required")
    }

    if(!description || description.trim() === "") {
        throw new ApiError(400, "Description is required")
    }

    if (videos && !Array.isArray(videos)) {
        throw new ApiError(400, "Videos must be an array of IDs");
    }

    // Validate ObjectId types for videos (optional strict check)
    if (videos && videos.some(id => !mongoose.Types.ObjectId.isValid(id))) {
        throw new ApiError(400, "One or more video IDs are invalid");
    }

    const playlist = await Playlist.create({
        name: name,
        description: description,
        videos: videos || [],
        owner: req.user._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Id")
    }

    const playlist = await Playlist.find({owner: userId})
    
    if(playlist.length === 0) {
        throw new ApiError(404, `User having Id: ${userId}, has no Playlists`)
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "User Playlist Found!"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError(404, `No playlist having Id: ${playlistId}`)
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Found!"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

  
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(409, "Video already in playlist")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added to Playlist"))

})


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!(playlist.videos.includes(videoId))) {
        throw new ApiError(409, "Video is not in the playlist")
    }

    playlist.videos = playlist.videos.filter( vid => vid.toString() !== videoId);

    await playlist.save()

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video is removed from the playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const rem_playlist = await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(new ApiResponse(200, rem_playlist, "Playlist has been removed"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
   const { playlistId } = req.params;
   const { name, description } = req.body;

   if (!isValidObjectId(playlistId)) {
       throw new ApiError(400, "Invalid playlistId");
   }

   if (!name && !description) {
       throw new ApiError(400, "Name or description is required to update");
   }

   const playlist = await Playlist.findById(playlistId);
   
   if (!playlist) {
       throw new ApiError(404, "Playlist not found");
   }

   playlist.name = name;
   playlist.description = description;

   await playlist.save();

   return res.status(200).json(
       new ApiResponse(200, playlist, "Playlist updated successfully")
   );
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}