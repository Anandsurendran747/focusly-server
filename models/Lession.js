const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: ['Life', 'Productivity', 'Health', 'Finance', 'Relationships', 'Career', 'Mindset', 'Tech', 'Other'],
      default: 'Life',
    },
    emoji: {
      type: String,
      default: '💡',
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [3000, 'Content cannot exceed 3000 characters'],
    },
    date: {
      type: String, // YYYY-MM-DD
      default: () => new Date().toISOString().split('T')[0],
    },
  },
  { timestamps: true }
);

lessonSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Lesson', lessonSchema);