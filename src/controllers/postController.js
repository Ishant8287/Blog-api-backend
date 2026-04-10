const Post = require("../models/Post");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

//Create Posts
exports.createPost = asyncHandler(async (req, res, next) => {
  const { title, content } = req.body;
  const post = await Post.create({
    title,
    content,
    userId: req.user._id,
  });
  
  res.status(201).json({
    status: "success",
    data: post,
  });
});

//Get ALl Posts
exports.getAllPosts = asyncHandler(async (req, res, next) => {
  //1.Filtering
  const queryObj = { ...req.query };
  const excludedFields = ["sort", "page", "limit"];
  excludedFields.forEach((el) => delete queryObj[el]);

  //2.Sorting
  let query = Post.find(queryObj).populate("userId", "name");
  if (req.query.sort) {
    query = query.sort(req.query.sort);
  }

  //3.)Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);
  const posts = await query;

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: posts,
  });
});

//Get Posts
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id).populate("userId", "name");

  if (!post) {
    return next(new AppError("Post NOT found", 404));
  }

  res.status(200).json({
    status: "success",
    data: post,
  });
});

//Update Post
exports.updatePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError("Post NOT found", 404));
  }

  //Ownership check
  const isOwner = post.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to update this post", 403));
  }

  const updates = {};
  ["title", "content"].forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const updatedPost = await Post.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: updatedPost,
  });
});

//Delete post
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  //Ownership check
  const isOwner = post.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to delete this post", 403));
  }

  await Post.findByIdAndDelete(req.params.id);

  res.status(204).send();
});
