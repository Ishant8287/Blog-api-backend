const Joi = require("joi");

//password regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

// Signup validation
exports.signUpSchema = Joi.object({
  name: Joi.string().min(3).max(50).trim().required(),

  email: Joi.string().email().lowercase().required(),

  password: Joi.string().pattern(passwordRegex).required().messages({
    "string.pattern.base":
      "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
  }),

  role: Joi.string().valid("user", "admin").default("user"),
});

// Login validation
exports.loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),

  password: Joi.string().required(),
});
