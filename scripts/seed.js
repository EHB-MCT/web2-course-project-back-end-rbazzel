import "dotenv/config";
import { ObjectId } from "mongodb";
import { getCollection, disconnectDB, client } from "../src/db.js";
import { hashPassword, generateToken } from "../src/utils/bcryptAuth.js";

const seedUsers = [
  { username: "alice", email: "alice@example.com", password: "password123" },
  { username: "bob", email: "bob@example.com", password: "mypassword" },
  { username: "charlie", email: "charlie@example.com", password: "secretpass" },
];

const seedPlaylists = [
  {
    title: "Rock Classics",
    description: "The best rock songs from the 70s and 80s.",
  },
  { title: "Coding Focus", description: "Lo-fi beats to study/code to." },
  { title: "Workout Mix", description: "High energy tracks for the gym." },
];

const seedSongs = [
  {
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    tab_url:
      "https://tabs.ultimate-guitar.com/tab/led-zeppelin/stairway-to-heaven-tabs-9488",
  },
  {
    title: "Wonderwall",
    artist: "Oasis",
    tab_url: "https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-tabs-27596",
  },
  {
    title: "Wish You Were Here",
    artist: "Pink Floyd",
    tab_url:
      "https://tabs.ultimate-guitar.com/tab/pink-floyd/wish-you-were-here-tabs-98406",
  },
];

const seed = async () => {
  try {
    const dbName = process.env.DB_NAME || "tablister";
    const adminDb = client.db(dbName);
    await adminDb.dropDatabase();
    console.log(`Dropped database: ${dbName}`);

    const usersCollection = await getCollection("users");
    const playlistsCollection = await getCollection("playlists");
    const userIds = [];

    for (const user of seedUsers) {
      const passwordHash = await hashPassword(user.password);
      const result = await usersCollection.insertOne({
        username: user.username,
        email: user.email,
        passwordHash,
      });

      userIds.push(result.insertedId);

      const insertedUser = await usersCollection.findOne({
        _id: result.insertedId,
      });
      const token = generateToken(insertedUser);

      console.log(`Inserted user: ${user.username}`);
      console.log(`JWT token: ${token}\n`);
    }

    for (let i = 0; i < seedPlaylists.length; i++) {
      const playlist = seedPlaylists[i];
      const userId = userIds[i % userIds.length];

      const songs = seedSongs.map((s) => ({
        id: new ObjectId(),
        ...s,
        createdAt: new Date(),
      }));

      await playlistsCollection.insertOne({
        ...playlist,
        userId,
        songs,
        createdAt: new Date(),
      });
      console.log(
        `Inserted playlist: ${playlist.title} with ${songs.length} songs`
      );
    }

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await disconnectDB();
  }
};

seed();
