/* this is a method to connect db but not profssional
import mongoose from "mongoose";
import {DB_NAME} from "./constant";

(async ()=>{
    try{
        await mongoose.connect(`${process.env.database_url}/{DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERR:",error)
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is Listen on port ${process.env.PORT}`)
        })

    }catch (error){
        console.error("ERROR:",error)
        throw error
    }
})()
*/




import express from "express";
import { app } from "./app.js"; 
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./.env'
})
connectDB()

.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on the port: ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Mongodb connectiion failed Error:",err)
})
app.on("error",(error)=>{
    console.log("ERR:",error)
    throw error
})




