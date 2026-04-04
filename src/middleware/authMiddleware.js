const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

// steps
// 1.request aayi
// 2.header se token nikla
// 3.token verify kiya
// 4.user nikala DB se
// 5.req.user mein store
// 6.next()

//Middleware to handle verification of token and protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  //Is header exists and , is it start with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // "Bearer abc123".split(" ") -> ["Bearer", "abc123"] -> [1] -> abc123 -> that's our token
    token = req.headers.authorization.split(" ")[1];
  }

  //If token not found
  if (!token) {
    return res.status(401).json({
      status: "fail",
      message: "You are not logged in",
    });
  }

  //token verify
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  //User exist check
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return res.status(401).json({
      status: "fail",
      message: "User no longer exists",
    });
  }

  req.user = currentUser;

  next();
});

//Middleware to handle authorization of user based on role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission",
      });
    }
    next();
  };
};
