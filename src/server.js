import cors from "cors";
import express from "express";
import morgan from "morgan";
import userRouter from "./routes/userRouter.js";

const app = express();

const corsOptions = {
  origin: JSON.parse(process.env.ALLOWED_ORIGINS ?? "[]"),
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server running healthy!" });
});

app.use("/users", userRouter);

export default app;
