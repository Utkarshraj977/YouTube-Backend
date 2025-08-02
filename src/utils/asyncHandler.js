const asyncHandler=(requestHandler)=>{  //If an error occurs (like database failure), Express will not catch it because the function is async.
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}



// const asyncHandler=(fn)=>async (req,res,next)=>{
//     try{
//         await fn(req,res,next)
//     }catch(error){
//            res.status(error.code || 500).json({
//              success: false,
//              message: error.message
//            }) 
//     }
// }
export {asyncHandler}
