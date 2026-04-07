const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { commentSchema, idSchema } = require("../validations/commentValidation");

// comments on a post
router
  .route("/posts/:id/comments")
  .get(validate(idSchema, "params"), commentController.getAllComments)
  .post(
    protect,
    validate(idSchema, "params"),
    validate(commentSchema, "body"),
    commentController.createComment,
  );

// single comment
router
  .route("/comments/:id")
  .get(validate(idSchema, "params"), commentController.getComment)
  .patch(
    protect,
    validate(idSchema, "params"),
    validate(commentSchema, "body"),
    commentController.updateComment,
  )
  .delete(
    protect,
    validate(idSchema, "params"),
    commentController.deleteComment,
  );

module.exports = router;
