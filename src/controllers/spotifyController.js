import axios from "axios";
import crypto from "node:crypto";
import { getCollection } from "../db.js";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const stateKey = "spotify_auth_state";

export const connect = (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  req.session[stateKey] = state;
  console.log("line 12, req.session:", req.session);

  const scope =
    "playlist-read-private playlist-read-collaborative user-read-private user-read-email";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state,
  });

  res.redirect(`${SPOTIFY_AUTH_URL}?${params.toString()}`);
};

export const callback = async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  console.log("line 32, req.query:", req.query);
  console.log("line 33, req.session:", req.session);

  const storedState = req.session[stateKey] || null;

  delete req.session[stateKey];

  if (!state || state !== storedState) {
    console.error("Authentication Error: State Mismatch Detected (CSRF risk).");
    return res.redirect(
      "http://localhost:5173/#" +
        new URLSearchParams({
          error: "state_mismatch",
        }).toString()
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Fetch Spotify user profile
    const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = profileResponse.data;

    // Save tokens and Spotify ID to MongoDB user
    const users = getCollection("users");
    await users.updateOne(
      { _id: req.user._id }, // assumes user is logged in in your app
      {
        $set: {
          spotifyId: profile.id,
          spotifyAccessToken: access_token,
          spotifyRefreshToken: refresh_token,
          spotifyTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        },
      }
    );

    // Redirect to frontend dashboard
    res.redirect("http://localhost:5173/dashboard");
  } catch (err) {
    console.error(err.response?.data || err);
    res.redirect(
      "/#" +
        new URLSearchParams({
          error: "spotify_auth_failed",
        }).toString()
    );
  }
};

// Refresh access token using stored refresh token
export const refreshToken = async (req, res) => {
  const users = getCollection("users");
  const user = await users.findOne({ _id: req.user._id });

  if (!user?.spotifyRefreshToken) {
    return res.status(400).send("No refresh token stored");
  }

  try {
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.spotifyRefreshToken,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
        },
      }
    );

    const { access_token, expires_in } = response.data;

    // Update DB
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          spotifyAccessToken: access_token,
          spotifyTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        },
      }
    );

    res.json({ access_token });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).send("Failed to refresh token");
  }
};

export default { connect, callback, refreshToken };
