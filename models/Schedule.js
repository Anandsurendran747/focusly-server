const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
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
        milestones: [
            {
                title: {
                    type: String,
                    required: [true, 'Milestone title is required'],
                    trim: true,
                    maxlength: [200, 'Milestone title cannot exceed 200 characters'],
                },
                description: {
                    type: String,
                    trim: true,
                    maxlength: [1000, 'Milestone description cannot exceed 1000 characters'],
                    default: '',
                },
                timeFrom: {
                    type: String,
                    required: [true, 'Milestone start time is required'],
                    trim: true,
                    maxlength: [5, 'Time must be in HH:MM format'],
                },
                timeTo: {
                    type: String,
                    required: [true, 'Milestone end time is required'],
                    trim: true,
                    maxlength: [5, 'Time must be in HH:MM format'],
                },
            }
        ],
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        fromDate: {
            type: Date, // stored as YYYY-MM-DD string
            default: null,
        },
        toDate: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

scheduleSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
