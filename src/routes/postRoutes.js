const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const likeController = require("../controllers/likeController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { postSchema } = require("../validations/postValidation");

//public routes
router.route("/").get(postController.getAllPosts);
router.route("/:id").get(postController.getPost);

//protected routes
router
  .route("/")
  .post(protect, validate(postSchema), postController.createPost);
router
  .route("/:id")
  .patch(protect, postController.updatePost)
  .delete(protect, postController.deletePost);
router.route("/:id/like").post(protect, likeController.toggleLike);

module.exports = router;
