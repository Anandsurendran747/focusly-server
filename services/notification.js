// services/notification.js
const admin = require("../firebase.js");
const Token = require("../models/Token.js");

async function sendNotification(token, title, body) {
    console.log("Sending notification to token:", token);
    try {
        const response = await admin.messaging().send({
            token,
            notification: { title, body }
        });
        console.log("Notification sent:", response);
    } catch (error) {
        console.error(error);
    }
}

async function sendNotificationToUser(userId, title, body) {
    console.log(`Sending notification to user ${userId}`);
    try {
        const tokenDoc = await Token.findOne({ userId });
        if (!tokenDoc) {
            console.error("Token not found for user:", userId);
            return;
        }
        await sendNotification(tokenDoc.token, title, body);
    } catch (error) {
        console.error("Error sending notification to user:", error);
    }
}

module.exports = sendNotificationToUser;