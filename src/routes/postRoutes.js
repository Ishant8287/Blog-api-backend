const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const likeController = require("../controllers/likeController");
const { protect } = require("../middleware/authMiddleware");

//public routes
router.route("/").get(postController.getAllPosts);
router.route("/:id").post(postController.getPost);

//protected routes
router.route("/").post(protect, postController.createPost);
router
  .route("/:id")
  .patch(protect, postController.updatePost)
  .delete(protect, postController.deletePost);
router.route("/:id/like").post(protect, likeController.toggleLike);

module.exports = router;
