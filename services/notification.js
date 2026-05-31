import admin from "firebase-admin";
import Token from "../models/Token.js";

async function sendNotification(token, title, body) {
    console.log("Sending notification to token:", token);
  try {
    const response = await admin.messaging().send({
      token,
      notification: {
        title,
        body
      }
    });

    console.log("Notification sent:", response);
  } catch (error) {
    console.error(error);
  }
}

export default async function sendNotificationToUser(userId, title, body) {
  try {
    const tokenDoc = await Token.findOne({ userId });
    if (!tokenDoc) {
      console.error("Token not found for user:", userId);
      return;
    }
    await sendNotification(tokenDoc.token, title, body);
  }
    catch (error) {
    console.error("Error sending notification to user:", error);
  }
}
