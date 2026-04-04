const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const { signUpSchema, loginSchema } = require("../validations/userValidation");

router.route("/signup").post(validate(signUpSchema), authController.signUp);
router.route("/login").post(validate(loginSchema), authController.loginUser);
router.route("/refresh-token").post(authController.refreshToken);
router.route("/logout").post(authController.logout);

module.exports = router;
