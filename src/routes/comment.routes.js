import { Router } from "express";
import { getVideosComments,addComment,updateComment,deleteComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()

router.route("/getcomment/:videoId").get(verifyJWT,getVideosComments)
router.route("/addcomment/:videoId").post(verifyJWT,addComment)
router.route("/updatecomment/:commentId").patch(verifyJWT,updateComment)
router.route("/deletecomment/:commentId").delete(verifyJWT,deleteComment)

export default router

