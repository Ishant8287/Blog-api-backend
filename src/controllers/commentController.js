const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

//Create comment
exports.createComment = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  //check post exists
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  const comment = await Comment.create({
    content,
    userId: req.user._id, // logged-in user
    postId: req.params.id, // from route
  });

  res.status(201).json({
    status: "success",
    data: comment,
  });
});

//Get All comments (optionally filter by post)
exports.getAllComments = asyncHandler(async (req, res, next) => {
  let filter = {};

  // 🔥 if route is /posts/:id/comments
  if (req.params.id) {
    filter.postId = req.params.id;
  }

  const comments = await Comment.find(filter)
    .populate("userId", "name")
    .populate("postId", "title");

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
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError("Comment NOT found", 404));
  }

  //ownership check
  const isOwner = comment.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to update this comment", 403));
  }

  // update
  comment.content = req.body.content || comment.content;

  await comment.save();

  res.status(200).json({
    status: "success",
    data: comment,
  });
});

//Delete Comment
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError("Comment NOT found", 404));
  }

  //ownership check
  const isOwner = comment.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to delete this comment", 403));
  }

  await comment.deleteOne();

  res.status(204).send();
});

