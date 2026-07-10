import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  studentId: {
    type: Number,
    required: true
  },
  courseId: {
    type: Number,
    required: true
  },
  completedTasks: {
    type: [Number], // Array de IDs de tareas de MySQL completadas
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índice compuesto para asegurar que un estudiante tenga un único registro de progreso por curso
progressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Progress = mongoose.model('Progress', progressSchema);
