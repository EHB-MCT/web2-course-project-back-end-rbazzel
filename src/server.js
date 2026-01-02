import cors from "cors";
import express from "express";
import morgan from "morgan";
import userRouter from "./routes/userRouter.js";
import playlistRouter from "./routes/playlistRouter.js";

const app = express();

const allowedOrigins = JSON.parse(process.env.ALLOWED_ORIGINS ?? "[]");

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server running healthy!" });
});

app.use("/users", userRouter);
app.use("/playlists", playlistRouter);

export default app;
