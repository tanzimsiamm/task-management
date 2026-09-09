import express from "express";
import authRouter from "./modules/auth/auth.route.js";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Task Management API is running",
  });
});

app.use("/api/auth", authRouter);

export default app;