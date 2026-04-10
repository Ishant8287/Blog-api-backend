const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const likeController = require("../controllers/likeController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { postSchema, postUpdateSchema } = require("../validations/postValidation");
const { idParamSchema } = require("../validations/commonValidation");

//public routes
router.route("/").get(postController.getAllPosts);
router.route("/:id").get(validate(idParamSchema, "params"), postController.getPost);

//protected routes
router
  .route("/")
  .post(protect, validate(postSchema), postController.createPost);
router
  .route("/:id")
  .patch(
    protect,
    validate(idParamSchema, "params"),
    validate(postUpdateSchema),
    postController.updatePost,
  )
  .delete(protect, validate(idParamSchema, "params"), postController.deletePost);
router.route("/:id/like").post(
  protect,
  validate(idParamSchema, "params"),
  likeController.toggleLike,
);

module.exports = router;
