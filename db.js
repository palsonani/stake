import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config()
const url = process.env.MONGO_URL;

mongoose.connect(url).then(() => {
    console.log("Database is connected");
}).catch((error) => {
    console.log("Error to connecting Database : ", error);
})



