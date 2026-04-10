const Joi = require("joi");

exports.idParamSchema = Joi.object({
  id: Joi.string().length(24).hex().required().messages({
    "string.length": "Invalid id",
    "string.hex": "Id must be a valid ObjectId",
  }),
}).required();
