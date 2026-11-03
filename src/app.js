import express from "express";

// directory-related imports
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// middleware imports
import basicLogger from "#modules/basicLogger/basicLogger.js";
import globalRateLimiter from "#modules/rateLimiter/globalRateLimiter.js";
import ipRateLimiter from "#modules/rateLimiter/ipRateLimiter.js";
import {
  handleNotFound,
  handleGlobalError,
} from "#modules/renderer/errorHandler.js";

// router imports
import indexRoutes from "#modules/index/index.routes.js";
import authRoutes from "#modules/auth/auth.routes.js";
import userRoutes from "#modules/users/user.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicPath = join(__dirname, "..", "public");

const app = express();

app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

// middleware
if (process.env.NODE_ENV !== "production") {
  app.use(basicLogger);
}
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath));
app.use(globalRateLimiter);
app.use(ipRateLimiter);

// routers
app.use("/users", userRoutes);
app.use("/", indexRoutes);
app.use("/", authRoutes);

// error handling
app.use(handleNotFound);
app.use(handleGlobalError);

export default app;
