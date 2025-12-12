import axios from "axios";
import crypto from "crypto";
import { getCollection } from "../db.js";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export const connect = (req, res) => {
  const scope =
    "playlist-read-private playlist-read-collaborative user-read-private user-read-email";
  const state = crypto.randomBytes(16).toString("hex");

  res.cookie("spotify_auth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state: state,
  });

  res.redirect(`${SPOTIFY_AUTH_URL}?${params.toString()}`);
};

export const callback = async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies["spotify_auth_state"] : null;

  if (state === null || state !== storedState) {
    res.clearCookie("spotify_auth_state");
    return res.redirect(
      FRONTEND_URL +
        "/#" +
        new URLSearchParams({ error: "state_mismatch" }).toString()
    );
  }

  res.clearCookie("spotify_auth_state");

  if (!code) {
    return res.redirect(
      FRONTEND_URL +
        "/#" +
        new URLSearchParams({ error: "missing_code" }).toString()
    );
  }

  try {
    const tokenResponse = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        code: code,
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

    const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: "Bearer " + access_token },
    });

    const profile = profileResponse.data;
    const users = await getCollection("users");
    const spotifyId = profile.id;

    req.session.spotifyUserId = spotifyId;

    await users.updateOne(
      { spotifyId: spotifyId },
      {
        $set: {
          spotifyId: spotifyId,
          spotifyAccessToken: access_token,
          spotifyRefreshToken: refresh_token,
          spotifyTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        },
      },
      { upsert: true }
    );

    res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error(err.response?.data || err);
    res.redirect(
      FRONTEND_URL +
        "/#" +
        new URLSearchParams({ error: "spotify_auth_failed" }).toString()
    );
  }
};

export const refreshToken = async (req, res) => {
  const refresh_token = req.query.refresh_token;

  if (!refresh_token) {
    return res.status(400).send("Missing refresh token in query.");
  }

  try {
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh_token,
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

    const {
      access_token,
      expires_in,
      refresh_token: new_refresh_token,
    } = response.data;

    res.send({
      access_token: access_token,
      refresh_token: new_refresh_token || refresh_token,
    });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).send("Failed to refresh token.");
  }
};

export const getProfile = async (req, res) => {
  if (!req.session || !req.session.spotifyUserId) {
    return res.status(401).json({ error: "Unauthorized: No active session." });
  }

  try {
    const users = await getCollection("users");

    const user = await users.findOne({ spotifyId: req.session.spotifyUserId });

    if (!user) {
      req.session.destroy();
      return res.status(401).json({ error: "User not found." });
    }

    const spotifyResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
      },
    });

    const spotifyData = spotifyResponse.data;

    const profileData = {
      displayName: spotifyData.display_name,
      id: spotifyData.id,
      email: spotifyData.email,
      product: spotifyData.product,
      country: spotifyData.country,
      imageUrl:
        spotifyData.images && spotifyData.images.length > 0
          ? spotifyData.images[0].url
          : null,
    };

    res.json(profileData);
  } catch (error) {
    console.error(
      "Profile Fetch Error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 401) {
      return res
        .status(401)
        .json({ error: "Spotify token expired. Please login again." });
    }

    res.status(500).json({ error: "Failed to fetch profile data." });
  }
};

export default { connect, callback, refreshToken, getProfile };
