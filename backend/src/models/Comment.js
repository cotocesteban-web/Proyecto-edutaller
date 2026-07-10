import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  studentId: {
    type: Number,
    required: true
  },
  instructorId: {
    type: Number,
    required: true
  },
  courseId: {
    type: Number,
    required: true
  },
  senderId: {
    type: Number, // ID de quien escribe el mensaje (alumno o profesor)
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export const Comment = mongoose.model('Comment', commentSchema);
