import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyEmail } from "../emailVerify/verifyEmail.js";
import { Session } from "../models/sessionModel.js";
import { sendOtpEmail } from "../emailVerify/sendOTPMail.js";
import cloudinary from "../utils/cloudnary.js";
import streamifier from "streamifier";


export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    const token = jwt.sign({ id: newUser._id }, process.env.SECRET_KEY, {
      expiresIn: "10m",
    });

    // console.log("Register Email:", email);
    // console.log("Generated Token:", token);

    await verifyEmail(token, email);

    newUser.token = token;
    await newUser.save();

    // console.log("Register Email:", email);
    // console.log("Generated Token:", token);

    await verifyEmail(token, email);

    newUser.token = token;
    await newUser.save();
    verifyEmail(token, email); //send email here
    console.log("Register Email:", email);
    console.log("Generated Token:", token);
    newUser.token = token;
    await newUser.save();
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error in register controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verify = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        success: false,
        message: "Authorization token is missing or Invalid token",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(400).json({
          success: false,
          message: "The Registration Token has expired",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Token Verification failed",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isVerified = true;
    user.token = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//re-verify email if token expires, generate new token and send email again
export const reVerify = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found with this email",
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "10m",
    });
    await verifyEmail(token, email);
    user.token = token;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
      token: user.token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User not exists",
      });
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password,
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    if (!existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Verify your email then  login",
      });
    }
    //generate token for login
    const accestoken = jwt.sign(
      { id: existingUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "10d" },
    );

    const refreshstoken = jwt.sign(
      { id: existingUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "30d" },
    );
    existingUser.isLoggedIn = true;
    await existingUser.save();

    //check for existing session, if exists delete
 
    const existingSession = await Session.findOne({
      userId: existingUser._id,
    });

    if (existingSession) {
      await Session.deleteOne({
        userId: existingUser._id,
      });
    }

    //create new session
    await Session.create({ userId: existingUser._id });
    // return res.status(200).json({
    //   success: true,
    //   message: `Welcome Back ${existingUser.firstName} ${existingUser.lastName}`,
    //   user: existingUser,
    //   accestoken,
    //   refreshstoken,
    // });

    return res.status(200).json({
  success: true,
  message: `Welcome Back ${existingUser.firstName} ${existingUser.lastName}`,
  user: existingUser,
  accestoken,
  refreshstoken,
});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//logout user
export const logout = async (req, res) => {
  try {
    console.log("req.user:", req.user);

    const userId = req.user.id;

    await Session.deleteMany({ userId });
    await User.findByIdAndUpdate(userId, { isLoggedIn: false });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found with this email",
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); //10 mins
    user.otp = otp;
    user.otpExpiry = otpExpiry;

    await user.save();
    await sendOtpEmail(otp, email);

    return res.status(200).json({
      success: true,
      message: "OTP sent to email successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//verify otp
export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.params.email;
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found with this email",
      });
    }
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message:
          "OTP is not generated or already verified, please generate new OTP",
      });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired, please generate new OTP",
      });
    }

    if (otp !== user.otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid",
      });
    }
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully, you can now reset your password",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//change password
export const changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password does not match",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res.status(400).json({
      success: false,
      message: "password Changed Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//all users get
export const allUser = async (_, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//get users using Id
export const getUserById=async(req,res)=>{
  try {
    const {userId}=req.params; //extract userId from request params
    const user=await User.findById(userId).select("-password -otp -otpExpiry -token")
    if(!user){
       res.status(404).json({
      success: false,
      message: "User not found",
    });
    }
     res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}



// Update User

export const updateUser = async (req, res) => {
  try {
    const userIdToUpdate = req.params.id;
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // FIX 1: Use loggedInUser._id (Mongoose default)
    // FIX 2: Check for both "admin" and "Admin" (or normalize to lowercase)
    const isSelf = loggedInUser._id.toString() === userIdToUpdate;
    const isAdminUser = loggedInUser.role?.toLowerCase() === "admin";

    if (!isSelf && !isAdminUser) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const user = await User.findById(userIdToUpdate);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update text fields
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phoneNo = req.body.phoneNo || user.phoneNo;
    user.city = req.body.city || user.city;
    user.address = req.body.address || user.address;
    user.zipCode = req.body.zipCode || user.zipCode;

    // Allow role update if the logged-in user is an Admin
    if (req.body.role && isAdminUser) {
      user.role = req.body.role;
    }

    // Handle Profile Picture Upload
    if (req.file) {
      console.log("Uploading image...");

      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "happyzing/profile",
      });

      user.profilepic = uploadResult.secure_url;          
      user.profilePicPublicId = uploadResult.public_id;
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};