import { MongoClient } from "mongodb";
import "dotenv/config";

const uri = process.env.DATABASE_URI;
if (!uri) throw new Error("DATABASE_URI not set in environment variables");

const dbName = process.env.DB_NAME || "tablister";

const client = new MongoClient(uri);
export { client };

let db;

const ensureConnection = async () => {
  if (!db) {
    try {
      await client.connect();
      db = client.db(dbName);
      console.log(`MongoDB connected to database: ${dbName}`);
    } catch (err) {
      console.error("MongoDB connection error:", err);
      throw err;
    }
  }
  return db;
};

export const getCollection = async (name) => {
  const database = await ensureConnection();
  return database.collection(name);
};

export const disconnectDB = async () => {
  if (client) {
    await client.close();
    db = null;
    console.log("MongoDB connection closed");
  }
};
