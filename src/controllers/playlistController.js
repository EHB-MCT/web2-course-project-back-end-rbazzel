import { ObjectId } from "mongodb";
import { getCollection } from "../db.js";

export const createPlaylist = async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id;
  const createdAt = new Date();

  try {
    const playlists = await getCollection("playlists");
    const result = await playlists.insertOne({
      title,
      description,
      userId: new ObjectId(userId),
      createdAt,
    });

    res.status(201).json({
      playlist: {
        id: result.insertedId,
        title,
        description,
        userId,
        createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPlaylistById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid playlist ID format" });
    }
    const playlists = await getCollection("playlists");
    const playlist = await playlists.findOne({ _id: new ObjectId(id) });

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    res.json({
      id: playlist._id,
      title: playlist.title,
      description: playlist.description,
      userId: playlist.userId,
      createdAt: playlist.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPlaylistsByUser = async (req, res) => {
  const userId = req.user.id;
  try {
    const playlists = await getCollection("playlists");
    const userPlaylists = await playlists
      .find({ userId: new ObjectId(userId) })
      .toArray();

    const formattedPlaylists = userPlaylists.map((p) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      userId: p.userId,
      createdAt: p.createdAt,
    }));

    res.json(formattedPlaylists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePlaylist = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid playlist ID format" });
    }

    const playlists = await getCollection("playlists");
    const playlist = await playlists.findOne({ _id: new ObjectId(id) });

    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const result = await playlists.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { title, description, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    const updated = result.value || result;
    res.json({
      id: updated._id,
      title: updated.title,
      description: updated.description,
      userId: updated.userId,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePlaylist = async (req, res) => {
  const { id } = req.params;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid playlist ID format" });
    }
    const playlists = await getCollection("playlists");
    const playlist = await playlists.findOne({ _id: new ObjectId(id) });

    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    await playlists.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: "Playlist deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
