import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export const Log = mongoose.model('Log', logSchema);
