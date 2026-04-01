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
