const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

//comments on a post
router
  .route("/posts/:id/comments")
  .get(commentController.getAllComments)
  .post(protect, commentController.createComment);

//single comment
router
  .route("/comments/:commentId")
  .get(commentController.getComment)
  .patch(protect, commentController.updateComment)
  .delete(protect, commentController.deleteComment);

module.exports = router;
