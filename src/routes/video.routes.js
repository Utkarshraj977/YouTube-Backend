import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos,deleteVideo,updateVideo,togglePublishStatus,getVideoById,publishAVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router=Router()

router.route("/getallvideos").get(verifyJWT,getAllVideos);
router.route("/getvideobyid/:videoId").get(verifyJWT,getVideoById);
router.route("/updatevideo/:videoId").patch(verifyJWT,upload.single("thumbnail")
,updateVideo);
router.route("/publishavideo").post(verifyJWT,upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),publishAVideo);
router.route("/togglepublishstatus/:videoId").post(verifyJWT,togglePublishStatus);
router.route("/deletevideo/:videoId").delete(verifyJWT,deleteVideo);

export default router


