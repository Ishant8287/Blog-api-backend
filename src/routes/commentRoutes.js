const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { commentSchema } = require("../validations/commentValidation");
const { idParamSchema } = require("../validations/commonValidation");

// comments on a post
router
  .route("/posts/:id/comments")
  .get(validate(idParamSchema, "params"), commentController.getAllComments)
  .post(
    protect,
    validate(idParamSchema, "params"),
    validate(commentSchema, "body"),
    commentController.createComment,
  );

// single comment
router
  .route("/comments/:id")
  .get(validate(idParamSchema, "params"), commentController.getComment)
  .patch(
    protect,
    validate(idParamSchema, "params"),
    validate(commentSchema, "body"),
    commentController.updateComment,
  )
  .delete(
    protect,
    validate(idParamSchema, "params"),
    commentController.deleteComment,
  );

module.exports = router;
