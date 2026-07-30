import expess from "express";
import { allUser, changePassword, forgotPassword, getUserById, login, logout, register,reVerify,updateUser,verify, verifyOtp  } from "../controller/userController.js";
import { isAdmin, isAuthenticator } from "../middleware/isAuthenticator.js";
import { singleUpload } from "../middleware/multer.js";
//import cloudinary from "../utils/cloudnary.js";



const router = expess.Router();

router.post("/register",register )
router.post("/verify",verify) 
router.post("/re-verify",reVerify)
router.post("/login",login) 
router.post("/logout",isAuthenticator,logout) 
router.post("/forgot-password",forgotPassword)
router.post("/change-password/:email",changePassword)
router.post("/verify-otp/:email",verifyOtp)
router.get("/all-user",isAuthenticator,isAdmin,allUser)
router.get("/get-user/:userId",getUserById)
router.put("/update/:id", isAuthenticator, singleUpload, updateUser);



// router.get("/cloudinary-upload-image-test", async (req, res) => {
//   try {
//     console.log(await cloudinary.api.ping());

//     const result = await cloudinary.uploader.upload(
//       "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png",
//       {
//         folder: "happyzing/profile",
//       }
//     );

//     return res.json({
//       success: true,
//       url: result.secure_url,
//     });
//   } catch (error) {
//     console.error("FULL ERROR:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//       http_code: error.http_code,
//       name: error.name,
//     });
//   }
// });



export default router;