const router = require("express").Router();
const FcmToken = require("../models/Token");
const admin = require("../firebase");
const auth = require("../middlewares/auth");

router.post("/save-token", auth, async (req, res) => {
    console.log("Saving token for user:", req.user.id);
    const { token } = req.body;

    await FcmToken.findOneAndUpdate(
        { userId: req.user.id },
        { token },
        { upsert: true, returnDocument: 'after' }
    );

    res.json({
        success: true
    });
});

router.post(
    "/notify",
    auth,
    async (req, res) => {
        const tokenDoc = await FcmToken.findOne({ userId: req.user.id });
        if (!tokenDoc) {
            return res.status(404).json({ message: "Token not found for user" });
        }

        await admin
            .messaging()
            .send({
                token: tokenDoc.token,
                notification: {
                    title: "Hello",
                    body: "Notification works"
                }
            });

        res.json({
            success: true
        });

    }
);

module.exports = router;