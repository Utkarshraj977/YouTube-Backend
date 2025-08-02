import { v2 as cloudinary } from "cloudinary";


const DeleteFromcloudinary = (async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);  // ✅ no callback
        console.log("Inside DeleteFromcloudinary:", result);         // ✅ should print second
        return result;
    } catch (error) {
        console.error("Error while deleting image:", error);
        throw error;
    }
});



const DeleteVideoFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
    console.log("Deleted video:", result);
    return result;
  } catch (error) {
    console.error("Error deleting video:", error);
    throw error;
  }
};

export  {DeleteFromcloudinary,DeleteVideoFromCloudinary};