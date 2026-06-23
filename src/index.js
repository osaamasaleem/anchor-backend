require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { ethers } = require('ethers');
const User = require('./models/User');
const Issuer = require('./models/Issuer'); 
const IssuedCredential = require('./models/IssuedCredential');

const app = express();

// --- BLOCKCHAIN CONFIGURATION ---
const CONTRACT_ADDRESS = "0x798f2bB3C65867B33D01Beb92D7E86a5e5F01F17";
const CONTRACT_ABI = [
    {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"cid","type":"string"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"CredentialRevoked","type":"event"},{"inputs":[{"internalType":"string","name":"_cid","type":"string"}],"name":"revokeCredential","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"admin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_cid","type":"string"}],"name":"isRevoked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"","type":"string"}],"name":"revokedCredentials","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}
];

// Database Connection
mongoose.connect('mongodb://localhost:27017/anchor_db')
  .then(() => console.log('Connected to MongoDB ✅'))
  .catch(err => console.error('MongoDB Error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// --- ISSUER ROUTES ---
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

app.post('/api/issuer/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const issuer = await Issuer.findOne({ officialEmail: email });
        if (!issuer || issuer.password !== password) return res.status(401).json({ message: "Invalid email or password." });
        if (issuer.status !== 'verified') return res.status(403).json({ message: "Access Denied: Your institution is currently 'Pending' Admin approval.", status: 'pending' });
        res.json({ message: "Login Successful", user: { institutionName: issuer.institutionName, officialEmail: issuer.officialEmail, did: issuer.did, status: issuer.status } });
    } catch (err) {
        res.status(500).json({ message: "Server error during login." });
    }
});

// --- ADMIN ROUTES ---
app.get('/api/admin/issuers', async (req, res) => {
    try {
        const issuers = await Issuer.find().sort({ createdAt: -1 });
        res.json(issuers);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch issuers" });
    }
});

app.patch('/api/admin/approve/:id', async (req, res) => {
    try {
        const { blockchainTx } = req.body; 
        const updatedIssuer = await Issuer.findByIdAndUpdate(req.params.id, { status: 'verified', blockchainTx: blockchainTx }, { new: true });
        if (!updatedIssuer) return res.status(404).json({ message: "Institution not found" });
        res.json({ message: "Institution Verified & Anchored Successfully!", issuer: updatedIssuer });
    } catch (err) {
        console.error("Approval Error:", err);
        res.status(500).json({ message: "Approval failed on server" });
    }
});

// --- HOLDER ROUTES ---
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

app.get('/api/users/:did', async (req, res) => {
  try {
    const user = await User.findOne({ did: req.params.did });
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// --- CREDENTIAL LOGGING ROUTES ---
app.post('/api/credentials/log', async (req, res) => {
    try {
        const trackingRecord = new IssuedCredential(req.body);
        await trackingRecord.save();
        res.status(201).json({ success: true, message: "Academic degree transaction logged to local history securely." });
    } catch (err) {
        console.error("Task 6 Database Logging Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/credentials/issuer/:issuerDID', async (req, res) => {
    try {
        const records = await IssuedCredential.find({ issuerDID: req.params.issuerDID }).sort({ createdAt: -1 });
        res.json(records);
    } catch (err) {
        console.error("Error reading issuer collections:", err);
        res.status(500).json({ message: "Failed to fetch real-time activity logs." });
    }
});





// ✅ CRITICAL UPDATE: Verify Proof Route now checks Blockchain Directly
app.get('/api/credentials/proof/:ipfsHash', async (req, res) => {
    try {
        const record = await IssuedCredential.findOne({ ipfsHash: req.params.ipfsHash });
        if (!record) return res.status(404).json({ message: "Cryptographic proof trace index not found." });
        
        // Query the Smart Contract directly to get real-time revocation status
        const provider = new ethers.providers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const onChainRevoked = await contract.isRevoked(req.params.ipfsHash);
        
        // Override local status if revoked on-chain
        const currentStatus = onChainRevoked ? 'revoked' : record.status;
        
        res.json({ ...record.toObject(), status: currentStatus });
    } catch (err) {
        console.error("Error fetching validation proof index:", err);
        res.status(500).json({ message: "Internal server exception reading ledger hash." });
    }
});

app.get('/api/public/issuer/did/:did', async (req, res) => {
    try {
        const issuer = await Issuer.findOne({ did: req.params.did, status: 'verified' });
        if (!issuer) return res.status(404).json({ message: "Unknown or unverified issuer." });
        res.json({ institutionName: issuer.institutionName, status: issuer.status });
    } catch (err) {
        console.error("Trust Registry lookup error:", err);
        res.status(500).json({ message: "Registry error" });
    }
});

app.put('/api/credentials/revoke/:cid', async (req, res) => {
    try {
        const targetCid = req.params.cid;
        console.log(`[BACKEND] Starting revocation for: ${targetCid}`);
        
        const provider = new ethers.providers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

        const feeData = await provider.getFeeData();
        const gasPrice = ethers.utils.parseUnits("60", "gwei"); 

        console.log(`[BLOCKCHAIN] Sending transaction...`);
        const tx = await contract.revokeCredential(targetCid, {
            gasLimit: 300000,
            gasPrice: gasPrice
        });
        
        console.log(`[BLOCKCHAIN] Transaction sent: ${tx.hash}`);
        await tx.wait(); 
        console.log(`[BLOCKCHAIN] Transaction confirmed!`);

        const updatedCredential = await IssuedCredential.findOneAndUpdate(
            { ipfsHash: targetCid },
            { status: 'revoked' },
            { returnDocument: 'after' } 
        );

        res.json({ message: "Successfully revoked.", status: 'revoked' });
    } catch (err) {
        console.error("--- FULL REVOCATION ERROR ---");
        console.error(err); 
        res.status(500).json({ message: "Detailed Error: " + err.message });
    }
});

// Start Server
//app.listen(5000, () => console.log('Server running on port 5000 ✅'));
app.listen(5000, '0.0.0.0', () => console.log('Server running on port 5000 ✅'));