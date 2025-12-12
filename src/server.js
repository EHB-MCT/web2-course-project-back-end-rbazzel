import cors from "cors";
import express from "express";
import morgan from "morgan";
import userRouter from "./routes/userRouter.js";
import spotifyRouter from "./routes/spotifyRouter.js";
import session from "express-session";
import cookieParser from "cookie-parser";

const app = express();

app.set("trust proxy", 1);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        JSON.parse(process.env.ALLOWED_ORIGINS ?? "[]").indexOf(origin) === -1
      ) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server running healthy!" });
});

app.use("/users", userRouter);
app.use("/auth/spotify", spotifyRouter);

export default app;
