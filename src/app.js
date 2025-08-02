import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"160kb"})) // for take json data or converting into json file
app.use(express.urlencoded({extended:true,limit:"16kb"})) //for taking data object inside the object
app.use(express.static("public")) //for store the data like image into the public folder
app.use(cookieParser()) // cookie jo store hota hai use is trh se convert kr deta hai ki use aur koi pdh nhi sakta hai sivay server ke


//routes import
import userRouter from './routes/user.routes.js'  //userRouetr is just a variable name
import commentRouter from './routes/comment.routes.js' //commentRouter is also same a variable name
import videoRouter from './routes/video.routes.js' //videoRouter is also same a variable name


//routes declaration
app.use("/api/v1/users",userRouter)  //link is http://localhost:8000/api/v1/users/register
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/video",videoRouter)

export {app}


