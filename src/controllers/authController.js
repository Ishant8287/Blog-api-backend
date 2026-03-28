const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

//Access Token -> Generate -> For API access
const signAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

//Refresh Token -> for generating new access token when access token expires
const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

//sign up
exports.signUp = asyncHandler(async (req, res, next) => {
  //Take all details of user from req.body
  const { name, email, password, role } = req.body;

  //found user
  const foundUser = await User.findOne({ email });

  //Exist -> error
  if (foundUser) {
    return res.status(400).json({
      status: "fail",
      message: "User with this email already exist",
    });
  }

  //Not exist
  const newUser = await User.create({ name, email, password, role: "user" });

  //Remove password from respone
  newUser.password = undefined;

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
  const foundUser = await User.findOne({ email });

  //If not exists
  if (!foundUser) {
    return res.status(401).json({
      status: "fail",
      message: "User NOT found",
    });
  }

  //If exist
  const isMatch = await bcrypt.compare(password, foundUser.password);

  //If not match
  if (!isMatch) {
    return res.status(401).json({
      status: "fail",
      message: "Password Incorrect",
    });
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
    return res.status(401).json({
      status: "fail",
      message: "Refresh token required",
    });
  }

  //Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

  //User check
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    return res.status(401).json({
      status: "fail",
      message: "User not found",
    });
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

  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});
