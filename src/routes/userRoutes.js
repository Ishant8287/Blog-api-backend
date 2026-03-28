const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect , userController.getAllUsers)
  .post(userController.createUser);
router
  .route("/:id")
  .get(protect , userController.getUser)
  .patch(protect , userController.updateUser)
  .delete(protect, restrictTo("admin"), userController.deleteUser);

module.exports = router;
