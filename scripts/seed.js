import "dotenv/config";
import { getCollection, disconnectDB, client } from "../src/db.js";
import { hashPassword, generateToken } from "../src/utils/bcryptAuth.js";

const seedUsers = [
  { username: "alice", email: "alice@example.com", password: "password123" },
  { username: "bob", email: "bob@example.com", password: "mypassword" },
  { username: "charlie", email: "charlie@example.com", password: "secretpass" },
];

const seed = async () => {
  try {
    const dbName = process.env.DB_NAME || "tablister";
    const adminDb = client.db(dbName);
    await adminDb.dropDatabase();
    console.log(`Dropped database: ${dbName}`);

    const usersCollection = await getCollection("users");

    for (const user of seedUsers) {
      const passwordHash = await hashPassword(user.password);
      const result = await usersCollection.insertOne({
        username: user.username,
        email: user.email,
        passwordHash,
      });

      const insertedUser = await usersCollection.findOne({
        _id: result.insertedId,
      });
      const token = generateToken(insertedUser);

      console.log(`Inserted user: ${user.username}`);
      console.log(`JWT token: ${token}\n`);
    }

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await disconnectDB();
  }
};

seed();
