const mongoose = require('mongoose');

const IssuerSchema = new mongoose.Schema({
    institutionName: { type: String, required: true },
    officialEmail: { type: String, required: true, unique: true },
    website: { type: String, required: true },
    adminName: { type: String, required: true },
    password: { type: String, required: true }, // For FYP simplicity, plain text. In production: use bcrypt.
    did: { type: String, required: true, unique: true },
    status: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected'], 
        default: 'pending' 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issuer', IssuerSchema);