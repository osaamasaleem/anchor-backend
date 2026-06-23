const mongoose = require('mongoose');

const issuedCredentialSchema = new mongoose.Schema({
    studentDID: { type: String, required: true },
    studentName: { type: String, required: true },
    studentID: { type: String, required: true },
    degreeTitle: { type: String, required: true },
    major: { type: String },
    gpa: { type: String },
    graduationDate: { type: Date },
    ipfsHash: { type: String, required: true },
    blockchainTx: { type: String, required: true },
    issuerDID: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    // ✅ CRITICAL FIX: Add the status field with a default value
    status: { type: String, default: 'valid' } 
});

module.exports = mongoose.model('IssuedCredential', issuedCredentialSchema);