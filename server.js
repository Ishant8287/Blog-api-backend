// Sync errors jo try catch mein nhi aaye
process.on("uncaughtException", (err) => {
  console.log("UncaughtException! Shutting down..");
  console.log(err.name, err.message);
  process.exit(1);
});

require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

//connectDB
connectDB().then(() => {
  server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on ${PORT}`);
  });
});

//handle Rejected promise -> Promise error jo catch nhi hue
process.on("unhandledRejection", (err) => {
  console.log("UnhandledRejection! Shutting down!");
  console.log(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else process.exit(1);
});
