const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin initialized");
}

module.exports = admin;