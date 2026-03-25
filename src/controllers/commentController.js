const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Comment = require("../models/Comment");

//Create comment
exports.createComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.create(req.body);

  res.status(201).json({
    status: "success",
    data: comment,
  });
});

//Get All comment
exports.getAllComments = asyncHandler(async (req, res, next) => {
  //Filtering
  const queryObj = { ...req.query };
  const excludedFields = ["limit", "sort", "page"];
  excludedFields.forEach((el) => delete queryObj[el]);

  //sorting
  let query = Comment.find(queryObj).populate("userId").populate("postId");
  if (req.query.sort) {
    query = query.sort(req.query.sort);
  }

  //pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  const comments = await query;

  res.status(200).json({
    status: "success",
    results: comments.length,
    data: comments,
  });
});

//Get single comment
exports.getComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(new AppError("Comment NOT found", 404));
  }

  res.status(200).json({
    status: "success",
    data: comment,
  });
});

//Update Comment
exports.updateComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!comment) {
    return next(new AppError("Comment NOT found", 404));
  }

  res.status(200).json({
    status: "success",
    data: comment,
  });
});

//Delete Comment
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findByIdAndDelete(req.params.id);

  if (!comment) {
    return next(new AppError("Comment not found", 404));
  }

  res.status(204).send();
});

