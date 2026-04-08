import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ApiError from "./utils/Apierror.js";
import ApiResponse from "./utils/Apiresponse.js";
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

   

    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};
export const register = async (req, res, next) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    // 🔹 Validate input
    if (!fullname || !email || !phoneNumber || !password || !role) {
      return next(new ApiError(400, "All fields are required"));
    }

    // 🔹 Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, "User already exists with this email"));
    }

    // 🔹 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Create user
    const user = await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
    });

    // 🔹 Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // 🔹 Send success response
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userResponse,
    });

  } catch (error) {
    next(error); // 🔥 pass error to middleware
  }
};
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // 🔹 Validate input
    if (!email || !password || !role) {
      return next(new ApiError(400, "Email, password and role are required"));
    }

    // 🔹 Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(401, "Invalid email or password"));
    }

    // 🔹 Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, "Invalid email or password"));
    }

    // 🔹 Check role
    if (role !== user.role) {
      return next(new ApiError(403, "Unauthorized access for this role"));
    }

    // 🔹 Generate tokens
    const { accessToken, refreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // 🔹 Remove password
    const loggedInUser = await User.findById(user._id).select("-password");

    // 🔹 Cookie options
    const options = {
      httpOnly: true,
      secure: true, // use false in local dev if not using HTTPS
      sameSite: "Strict",
    };

    // 🔹 Send response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          `Welcome back ${user.fullname}`
        )
      );

  } catch (error) {
    next(error); // 🔥 important
  }
};
export const logout = async (req, res) => {
    try {
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict"
};

return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"));
}
     catch (error) {
        console.log(error);
    }
};
export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        
        const file = req.file;
        // cloudinary ayega idhar
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content);



        let skillsArray;
        if(skills){
            skillsArray = skills.split(",");
        }
        const userId = req.id; // middleware authentication
        let user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            })
        }
        // updating data
        if(fullname) user.fullname = fullname
        if(email) user.email = email
        if(phoneNumber)  user.phoneNumber = phoneNumber
        if(bio) user.profile.bio = bio
        if(skills) user.profile.skills = skillsArray
      
        // resume comes later here...
        if(cloudResponse){
            user.profile.resume = cloudResponse.secure_url // save the cloudinary url
            user.profile.resumeOriginalName = file.originalname // Save the original file name
        }


        await user.save();

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).json({
            message:"Profile updated successfully.",
            user,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}