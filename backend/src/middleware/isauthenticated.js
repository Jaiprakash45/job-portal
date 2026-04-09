import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
  try {
    // 1. Get token from cookies OR Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // 2. If no token → unauthorized
    if (!token) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false,
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    

    // 4. Attach user id to request
    req.id = decoded.userId;

    // 5. Move to next middleware/controller
    next();
  } catch (error) {
    console.log(error);

    return res.status(401).json({
      message: "Invalid or expired token",
      success: false,
    });
  }
};

export default isAuthenticated;