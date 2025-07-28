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
import videoRouter from "./routes/video.routes.js"


app.use("/api/v1/users", userRouter) 
app.use("/api/v1/videos", videoRouter)


export default app // can use only because exporting one main thing 