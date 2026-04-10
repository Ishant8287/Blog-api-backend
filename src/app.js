const express = require("express");
const AppError = require("./utils/AppError");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

//Routes
const postRoutes = require("./routes/postRoutes");    
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/commentRoutes");
const authRoutes = require("./routes/authRoutes");

/*
helmet(security guard):->
XSS protection
Clickjacking protection
Secure headers add karta hai
*/

//Create instance
const app = express();

//Trust proxy
app.set("trust proxy", true);

//security headers
app.use(helmet());

//Cors
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

//Body parser
app.use(express.json());

//Rate limiting
//API limiter
const apiLimiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, try again later",
});

//Login Limiter
const loginLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: "Too many login attempts , try later",
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", loginLimiter);

//Routes
app.use("/api/posts", postRoutes);
app.use("/api", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

//404 Fallback
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

//Error Middleware
app.use((err, req, res, next) => {
  let error = err;

  if (error.name === "CastError") {
    error = new AppError(`Invalid ${error.path}`, 400);
  } else if (error.code === 11000) {
    error = new AppError("Duplicate field value entered", 409);
  } else if (error.name === "ValidationError") {
    error = new AppError(
      Object.values(error.errors)
        .map((item) => item.message)
        .join(", "),
      400,
    );
  } else if (error.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again.", 401);
  } else if (error.name === "TokenExpiredError") {
    error = new AppError("Token expired. Please log in again.", 401);
  } else if (error.type === "entity.parse.failed") {
    error = new AppError("Invalid JSON payload", 400);
  }

  error.statusCode =
    error.statusCode || (typeof error.status === "number" ? error.status : 500);
  error.status =
    typeof error.status === "string"
      ? error.status
      : error.statusCode >= 400 && error.statusCode < 500
        ? "fail"
        : "error";

  if (process.env.NODE_ENV === "development") {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      stack: error.stack,
    });
  }

  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  //Unknown error
  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
});

module.exports = app;
