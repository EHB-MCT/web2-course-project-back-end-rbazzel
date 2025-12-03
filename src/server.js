import cors from "cors";
import express from "express";
import morgan from "morgan";
import userRouter from "./routes/userRouter.js";
import spotifyRouter from "./routes/spotifyRouter.js";
import cookieParser from "cookie-parser";
import session from "express-session";

const app = express();

const corsOptions = {
  origin: JSON.parse(process.env.ALLOWED_ORIGINS ?? "[]"),
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server running healthy!" });
});

app.use("/users", userRouter);
app.use("/auth/spotify", spotifyRouter);

export default app;
