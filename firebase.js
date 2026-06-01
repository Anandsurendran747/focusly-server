const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();
console.log("projectId:", process.env.FIREBASE_PROJECT_ID);
console.log("clientEmail:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("privateKey first 100:", process.env.FIREBASE_PRIVATE_KEY?.slice(0, 100));

const privateKey = process.env.FIREBASE_PRIVATE_KEY
    .replace(/\\n/g, '\n')
    .replace(/"/g, '');

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,    // ✅ camelCase
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
    })
});

console.log("✅ Firebase Admin initialized");

module.exports = admin;