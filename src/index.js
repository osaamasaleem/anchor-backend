const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');

// This line allows us to use a .env file to hide our password
require('dotenv').config(); 

const app = express();

/**
 * --- DATABASE CONNECTION ---
 * We use process.env.MONGODB_URI for the Cloud (Render)
 * and fallback to the local string for development
 */
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/anchor_db";

mongoose.connect(MONGO_URI)
  .then(() => {
    const connType = process.env.MONGODB_URI ? "Cloud (Atlas)" : "Local";
    console.log(`Connected to MongoDB ${connType} ✅`);
  })
  .catch(err => console.error('Database Connection Error ❌:', err));

// Middleware
app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, did } = req.body;
    const existingUser = await User.findOne({ $or: [{ did }, { email }] });
    if (existingUser) return res.status(400).json({ message: "User already exists." });

    const newUser = new User({ name, email, did });
    await newUser.save();
    res.status(201).json({ message: "Success", user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Fetch Profile
app.get('/api/users/:did', async (req, res) => {
  try {
    const user = await User.findOne({ did: req.params.did });
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));