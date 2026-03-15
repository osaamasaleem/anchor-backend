const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Issuer = require('./models/Issuer'); // Import the new model

const app = express();


// Database
mongoose.connect('mongodb://localhost:27017/anchor_db')
  .then(() => console.log('Connected to MongoDB ✅'))
  .catch(err => console.error('MongoDB Error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// --- ISSUER ROUTES (Phase 2B.1) ---

// 1. Issuer Registration
app.post('/api/issuer/register', async (req, res) => {
    try {
        const { officialEmail } = req.body;
        const existing = await Issuer.findOne({ officialEmail });
        if (existing) return res.status(400).json({ message: "Institution already registered." });

        const newIssuer = new Issuer(req.body);
        await newIssuer.save();
        res.status(201).json({ message: "Success", issuer: newIssuer });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Issuer Login (With Verification Check)
// 2. Issuer Login (Strict Validation)
app.post('/api/issuer/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find the issuer by email
        const issuer = await Issuer.findOne({ officialEmail: email });

        if (!issuer || issuer.password !== password) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // The Gate: Block login if not verified by Admin
        if (issuer.status !== 'verified') {
            return res.status(403).json({ 
                message: "Access Denied: Your institution is currently 'Pending' Admin approval.",
                status: 'pending' 
            });
        }

        // Only send necessary data back
        res.json({ 
            message: "Login Successful", 
            user: {
                institutionName: issuer.institutionName,
                officialEmail: issuer.officialEmail,
                did: issuer.did,
                status: issuer.status
            } 
        });
    } catch (err) {
        res.status(500).json({ message: "Server error during login." });
    }
});


// --- ADMIN ROUTES (The Trust Anchor Logic) Phase 2B.1 ---

// 1. Get all Issuers (so the Admin can see the list)
app.get('/api/admin/issuers', async (req, res) => {
    try {
        const issuers = await Issuer.find().sort({ createdAt: -1 });
        res.json(issuers);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch issuers" });
    }
});


// 2. Approve an Issuer (The "Vouching" Action - Updated for Blockchain)
app.patch('/api/admin/approve/:id', async (req, res) => {
    try {
        // We now extract the blockchainTx hash sent from verify.html
        const { blockchainTx } = req.body; 

        const updatedIssuer = await Issuer.findByIdAndUpdate(
            req.params.id, 
            { 
                status: 'verified',
                blockchainTx: blockchainTx // Saving the on-chain proof
            }, 
            { new: true }
        );

        if (!updatedIssuer) {
            return res.status(404).json({ message: "Institution not found" });
        }

        res.json({ 
            message: "Institution Verified & Anchored Successfully!", 
            issuer: updatedIssuer 
        });
    } catch (err) {
        console.error("Approval Error:", err);
        res.status(500).json({ message: "Approval failed on server" });
    }
});

// --- Holder ROUTES --- Phase 2A

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



// Start Server (Keep this at the bottom!)
app.listen(5000, () => console.log('Server running on port 5000'));