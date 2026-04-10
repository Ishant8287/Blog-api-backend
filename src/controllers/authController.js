const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const verifyToken = (token, secret, errorMessage) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new AppError(errorMessage, 401);
  }
};

//Access Token -> Generate -> For API access
const signAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

//Refresh Token -> for generating new access token when access token expires
const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};  

//sign up
exports.signUp = asyncHandler(async (req, res, next) => {
  //Take all details of user from req.body
  const { name, email, password } = req.body;

  //found user
  const foundUser = await User.findOne({ email });

  //Exist -> error
  if (foundUser) {
    throw new AppError("User with this email already exists", 400);
  }

  //Not exist
  const newUser = await User.create({ name, email, password, role: "user" });

  //Remove password from respone
  newUser.password = undefined;
  newUser.refreshToken = undefined;

  //Successfull status
  res.status(201).json({
    status: "success",
    data: newUser,
  });
});

//Login
exports.loginUser = asyncHandler(async (req, res, next) => {
  //Take email and password from req.body
  const { email, password } = req.body;

  //found user
  const foundUser = await User.findOne({ email }).select("+password");

  //If not exists
  if (!foundUser) {
    throw new AppError("Invalid email or password", 401);
  }

  //If exist
  const isMatch = await bcrypt.compare(password, foundUser.password);

  //If not match
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  //If match
  const accesstoken = signAccessToken(foundUser._id);
  const refreshToken = signRefreshToken(foundUser._id);

  foundUser.refreshToken = refreshToken;
  await foundUser.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    accesstoken,
    refreshToken,
  });
});

//Refresh Token code
exports.refreshToken = asyncHandler(async (req, res, next) => {
  //Take refresh token from body
  const { refreshToken } = req.body;

  //If we don't have refresh token
  if (!refreshToken) {
    throw new AppError("Refresh token required", 401);
  }

  //Verify refresh token
  const decoded = verifyToken(
    refreshToken,
    process.env.JWT_REFRESH_SECRET,
    "Invalid or expired refresh token",
  );

  //User check
  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError("Invalid refresh token", 401);
  }
  const newAccessToken = signAccessToken(user._id);

  res.status(200).json({
    status: "success",
    accesstoken: newAccessToken,
  });
});

//Log out
exports.logout = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError("Refresh token required", 400);
  }

  const decoded = verifyToken(
    refreshToken,
    process.env.JWT_REFRESH_SECRET,
    "Invalid or expired refresh token",
  );

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});
