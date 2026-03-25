const express = require("express");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const AppError = require("./utils/AppError");

//Create instance
const app = express();

//Trust proxy
app.set("trust proxy", true);

//Create Golbal Middleware
app.use(express.json());

//Routes
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);

//404 Fallback
app.use((req, res, next) => {
  next(new AppError(`Can't find${req.originalUrl}`, 404));
});

//Error Middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  //Unknown error
  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
});

module.exports = app;
