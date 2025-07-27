import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser" //to access an set(CRUD Operations) cookies from user browser

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN, // which origin we are allowing
    credentials: true
}))

app.use(express.json({limit: "16kb"})) // Limits how much data json we accept/allow so server would not crash
app.use(express.urlencoded({extended: true, limit: "16kb"})) // so express can readed encoded url's
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'
// import healthcheckRouter from "./routes/healthcheck.routes.js"
// import tweetRouter from "./routes/tweet.routes.js"
// import subscriptionRouter from "./routes/subscription.routes.js"
// import videoRouter from "./routes/video.routes.js"
// import commentRouter from "./routes/comment.routes.js"
// import likeRouter from "./routes/like.routes.js"
// import playlistRouter from "./routes/playlist.routes.js"
// import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration // .use() method is used because now middlewares are involved 
// app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter) //prefix url would be like /users/register
// app.use("/api/v1/tweets", tweetRouter)
// app.use("/api/v1/subscriptions", subscriptionRouter)
// app.use("/api/v1/videos", videoRouter)
// app.use("/api/v1/comments", commentRouter)
// app.use("/api/v1/likes", likeRouter)
// app.use("/api/v1/playlist", playlistRouter)
// app.use("/api/v1/dashboard", dashboardRouter)

// http://localhost:8000/api/v1/users/register

export default app // can use only because exporting one main thing 