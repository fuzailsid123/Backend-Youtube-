import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`); //This tells you which server (host) the connection is usin
        const { host, port, name } = connectionInstance.connection;
        console.log(`Connected to ${name} on ${host}:${port}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1) //Immediately stop the application and return an exit code with error to OS
    }
}

export default connectDB // Default used so we don't have to use {} while importing, but it only be used when we are exporting one main thing