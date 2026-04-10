module.exports = (schema, property = "body") => {
  return (req, res, next) => {
    const data = req[property];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        status: "fail",
        errors,
      });
    }
    req[property] = value;
    next();
  };
};
