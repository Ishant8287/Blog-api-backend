const Post = require("../models/Post");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

//Create Posts
exports.createPost = asyncHandler(async (req, res, next) => {
  const post = await Post.create(req.body);
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
  let query = Post.find(queryObj).populate("userId");
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
  const post = await Post.findById(req.params.id).populate("userId");

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
  const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!post) {
    return next(new AppError("Post NOT found", 404));
  }

  res.status(200).json({
    status: "success",
    data: post,
  });
});

//Delete post
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findByIdAndDelete(req.params.id);

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  res.status(204).send();
});
