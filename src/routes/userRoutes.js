const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  signUpSchema,
  userUpdateSchema,
} = require("../validations/userValidation");
const { idParamSchema } = require("../validations/commonValidation");

router
  .route("/")
  .get(protect, restrictTo("admin"), userController.getAllUsers)
  .post(protect, restrictTo("admin"), validate(signUpSchema), userController.createUser);
router
  .route("/:id")
  .get(protect, validate(idParamSchema, "params"), userController.getUser)
  .patch(
    protect,
    validate(idParamSchema, "params"),
    validate(userUpdateSchema),
    userController.updateUser,
  )
  .delete(
    protect,
    restrictTo("admin"),
    validate(idParamSchema, "params"),
    userController.deleteUser,
  );

module.exports = router;
