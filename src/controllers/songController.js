import { ObjectId } from "mongodb";
import { getCollection } from "../db.js";

export const addSongToPlaylist = async (req, res) => {
  const { playlistId } = req.params;
  const { title, artist, tab_url } = req.body;

  try {
    if (!ObjectId.isValid(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID format" });
    }

    const playlists = await getCollection("playlists");
    const playlist = await playlists.findOne({ _id: new ObjectId(playlistId) });

    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const newSong = {
      id: new ObjectId(),
      title,
      artist,
      tab_url,
      createdAt: new Date(),
    };

    await playlists.updateOne(
      { _id: new ObjectId(playlistId) },
      { $push: { songs: newSong } }
    );

    res.status(201).json({ song: newSong });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSong = async (req, res) => {
  const { playlistId, songId } = req.params;
  const { title, artist, tab_url } = req.body;

  try {
    if (!ObjectId.isValid(playlistId) || !ObjectId.isValid(songId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const playlists = await getCollection("playlists");
    const playlist = await playlists.findOne({ _id: new ObjectId(playlistId) });

    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const result = await playlists.findOneAndUpdate(
      { _id: new ObjectId(playlistId), "songs.id": new ObjectId(songId) },
      {
        $set: {
          "songs.$.title": title,
          "songs.$.artist": artist,
          "songs.$.tab_url": tab_url,
          "songs.$.updatedAt": new Date(),
        },
      },
      { returnDocument: "after" }
    );

    const updated = result.value || result;
    const song = updated.songs.find((s) => s.id.toString() === songId);
    res.json(song);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeSongFromPlaylist = async (req, res) => {
  const { playlistId, songId } = req.params;

  try {
    if (!ObjectId.isValid(playlistId) || !ObjectId.isValid(songId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const playlists = await getCollection("playlists");
    const playlist = await playlists.findOne({ _id: new ObjectId(playlistId) });

    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    await playlists.updateOne(
      { _id: new ObjectId(playlistId) },
      { $pull: { songs: { id: new ObjectId(songId) } } }
    );

    res.json({ message: "Song removed from playlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSongsByPlaylist = async (req, res) => {
  const { playlistId } = req.params;

  try {
    if (!ObjectId.isValid(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID format" });
    }

    const playlists = await getCollection("playlists");
    const playlist = await playlists.findOne({ _id: new ObjectId(playlistId) });

    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    res.json(playlist.songs || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSongById = async (req, res) => {
  const { playlistId, songId } = req.params;

  try {
    if (!ObjectId.isValid(playlistId) || !ObjectId.isValid(songId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const playlists = await getCollection("playlists");
    const playlist = await playlists.findOne({ _id: new ObjectId(playlistId) });

    if (!playlist)
      return res.status(404).json({ message: "Playlist not found" });

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const song = playlist.songs?.find((s) => s.id.toString() === songId);
    if (!song) return res.status(404).json({ message: "Song not found" });

    res.json(song);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
