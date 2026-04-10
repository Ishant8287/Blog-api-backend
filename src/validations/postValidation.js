const Joi = require("joi");

exports.postSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  content: Joi.string().min(5).required(),
});

exports.postUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(100),
  content: Joi.string().min(5),
}).min(1);
