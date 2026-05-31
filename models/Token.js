const mongoose = require("mongoose");

const fcmTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    token: {
      type: String,
      required: true
    },
    deviceType: {
      type: String,
      enum: ["web", "android", "ios"],
      default: "web"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "FcmToken",
  fcmTokenSchema
);