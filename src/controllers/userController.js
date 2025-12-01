import { ObjectId } from "mongodb";
import { getCollection } from "../db.js";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";

export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const users = await getCollection("users");
    const existing = await users.findOne({ $or: [{ email }, { username }] });
    if (existing)
      return res.status(409).json({ message: "User already exists" });

    const passwordHash = await hashPassword(password);
    const result = await users.insertOne({ username, email, passwordHash });
    const user = await users.findOne({ _id: result.insertedId });

    const token = generateToken(user);
    res.status(201).json({ user: { id: user._id, username, email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await getCollection("users");
    const user = await users.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await comparePassword(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ user: { id: user._id, username: user.username, email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const users = await getCollection("users");
    const user = await users.findOne(
      { _id: new ObjectId(id) },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  if (updates.password) {
    updates.passwordHash = await hashPassword(updates.password);
    delete updates.password;
  }

  try {
    const users = await getCollection("users");
    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after", projection: { passwordHash: 0 } }
    );
    if (!result.value)
      return res.status(404).json({ message: "User not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const users = await getCollection("users");
    const result = await users.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
