const mongoose = require('mongoose');

/**
 * Task 8: The Holder (Student) Model
 * Note: We removed backup_phrase_hash to follow SSI privacy best practices.
 */
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // No two students can have the same email
    lowercase: true,
  },
  // This is the student's unique identity on the blockchain
  did: {
    type: String,
    required: true,
    unique: true, // The DID is our Primary Key (PK) equivalent
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);