const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Post = require("../models/Post");

exports.toggleLike = asyncHandler(async (req, res, next) => {
  //Get the post u want to like
  const post = await Post.findById(req.params.id);

  //If not found
  if (!post) {
    return next(new AppError("Post NOT found", 404));
  }

  //take user id
  const userId = req.user._id;

  //check if already liked
  const alreadyLiked = post.likes.some(
    (id) => id.toString() === userId.toString(),
  );

  if (alreadyLiked) {
    //unlike
    post.likes = post.likes.filter((id) => id.toString() != userId.toString());
  } else {
    //Like
    post.likes.push(userId);
  }

  await post.save();

  res.status(200).json({
    status: "success",
    liked: !alreadyLiked,
    totalLikes: post.likes.length,
    data: post,
  });
});
