const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    periodType: {
      type: String,
      enum: ['day', 'week', 'month', 'quarter', 'year', 'custom'],
      default: 'day',
    },
    dueDate: {
      type: String, // stored as YYYY-MM-DD string
      default: null,
    },
    startDate: {
      type: String,
      default: null,
    },
    endDate: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Reset completion status for multi-day todos if the completion was from a previous day.
todoSchema.pre('save', function (next) {
  if (!this.completed) {
    if (this.isModified('completed')) {
      this.completedAt = null;
    }
    return next();
  }

  if (!this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.startDate && this.endDate && this.startDate !== this.endDate && this.completedAt) {
    const completedDate = new Date(this.completedAt.toISOString().slice(0, 10));
    const today = new Date(new Date().toISOString().slice(0, 10));
    if (today > completedDate) {
      this.completed = false;
      this.completedAt = null;
    }
  }
});
// Compound index for efficient per-user queries
todoSchema.index({ user: 1, createdAt: -1 });
todoSchema.index({ user: 1, completed: 1 });

module.exports = mongoose.model('Todo', todoSchema);