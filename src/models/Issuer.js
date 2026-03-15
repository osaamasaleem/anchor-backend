const mongoose = require('mongoose');

const IssuerSchema = new mongoose.Schema({
    institutionName: { type: String, required: true },
    officialEmail: { type: String, required: true, unique: true },
    website: { type: String, required: true },
    adminName: { type: String, required: true },
    password: { type: String, required: true }, 
    did: { type: String, required: true, unique: true },
    status: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected'], 
        default: 'pending' 
    },
    // --- ADD THIS FIELD FOR TASK 3 ---
    blockchainTx: { 
        type: String, 
        default: null 
    }, 
    // --------------------------------
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issuer', IssuerSchema);