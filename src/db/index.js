import mongoose from "mongoose";
import {DB_NAME} from "../constant.js";

const connectDB=async ()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.database_url}/${DB_NAME}`)
        console.log(`mogoose connected !! DB HOST ${connectionInstance.connection.host}`);

    }catch (error){
        console.log("ERROr:",error);
        process.exit(1);
    }
}

export default connectDB;

