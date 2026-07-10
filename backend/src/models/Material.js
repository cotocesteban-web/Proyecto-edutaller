import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  courseId: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

export const Material = mongoose.model('Material', materialSchema);
