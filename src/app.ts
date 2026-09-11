import express from "express";
import authRouter from "./modules/auth/auth.route.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Task Management API is running",
  });
});

app.use("/api/auth", authRouter);
app.use(errorHandler);

export default app;