import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"})) // for take json data or converting into json file
app.use(express.urlencoded({extended:true,limit:"16kb"})) //for taking data object inside the object
app.use(express.static("public")) //for store the data like image into the public folder
app.use(cookieParser()) // cookie jo store hota hai use is trh se convert kr deta hai ki use aur koi pdh nhi sakta hai sivay server ke



export {app}


