const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const User = require("../models/User");

const ensureUserAccess = (req, next, message) => {
  const isAdmin = req.user.role === "admin";
  const isSameUser = req.user._id.toString() === req.params.id;

  if (!isAdmin && !isSameUser) {
    next(new AppError(message, 403));
    return false;
  }

  return true;
};

//Create User
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, password, role });

  //Should not shown in response
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(201).json({
    status: "success",
    data: user,
  });
});

//Get All User
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  //Filtering
  const queryObj = { ...req.query };
  const excludedFields = ["limit", "sort", "page"];
  excludedFields.forEach((el) => delete queryObj[el]);

  //sorting
  let query = User.find(queryObj);
  if (req.query.sort) {
    query = query.sort(req.query.sort);
  }

  //pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  const users = await query;

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

//Get single User
exports.getUser = asyncHandler(async (req, res, next) => {
  if (!ensureUserAccess(req, next, "Not authorized to access this user")) {
    return;
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("User NOT found", 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

//Update User
exports.updateUser = asyncHandler(async (req, res, next) => {
  if (!ensureUserAccess(req, next, "Not authorized to update this user")) {
    return;
  }

  const safeFields = {};
  ["name", "email"].forEach((field) => {
    if (req.body[field] !== undefined) {
      safeFields[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.params.id, safeFields, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError("User NOT found", 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

//Delete User
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(204).send();
});
