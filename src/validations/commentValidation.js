const Joi = require("joi");

exports.commentSchema = Joi.object({
  content: Joi.string().min(2).max(500).trim().required().messages({
    "string.empty": "Comment cannot be empty",
    "string.min": "Comment must be at least 2 characters",
    "string.max": "Comment is too long",
  }),
}).required();
