const cron = require("node-cron");
const sendNotificationToUser = require("./notification.js");
const Schedule = require("../models/Schedule.js");

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// ✅ In-memory lock to prevent duplicate notifications
const notifiedThisSession = new Set();

// ✅ Convert HH:MM IST string to UTC Date object for today
function istTimeToUTC(hours, minutes) {
    const now = new Date();
    const nowIST = new Date(now.getTime() + IST_OFFSET_MS);

    const milestoneIST = new Date(0);
    milestoneIST.setUTCFullYear(nowIST.getUTCFullYear());
    milestoneIST.setUTCMonth(nowIST.getUTCMonth());
    milestoneIST.setUTCDate(nowIST.getUTCDate());
    milestoneIST.setUTCHours(hours, minutes, 0, 0);

    return new Date(milestoneIST.getTime() - IST_OFFSET_MS);
}

// ✅ Format time for notification message (12hr format)
function formatTime(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ✅ Build a rich notification message
function buildNotificationMessage(milestone, diffMinutes) {
    const timeFormatted = formatTime(milestone.timeFrom);
    const endFormatted = milestone.timeTo ? formatTime(milestone.timeTo) : null;

    if (diffMinutes <= 0) {
        return {
            title: `🔔 Starting Now: ${milestone.title}`,
            body: endFormatted
                ? `Your milestone has started! Running until ${endFormatted}.`
                : `Your milestone is starting right now!`
        };
    }

    return {
        title: `⏰ Upcoming: ${milestone.title}`,
        body: endFormatted
            ? `Starts at ${timeFormatted} and runs until ${endFormatted}.`
            : `Starting in ${Math.round(diffMinutes)} minute${diffMinutes > 1 ? "s" : ""} at ${timeFormatted}.`
    };
}

// ✅ Validate time string
function isValidTime(hours, minutes) {
    return (
        !Number.isNaN(hours) &&
        !Number.isNaN(minutes) &&
        hours >= 0 && hours <= 23 &&
        minutes >= 0 && minutes <= 59
    );
}

async function processMilestone(schedule, milestone, now) {
    const [hours, minutes] = milestone.timeFrom.split(":").map(Number);

    if (!isValidTime(hours, minutes)) return null;

    const milestoneUTC = istTimeToUTC(hours, minutes);
    const diffMinutes = (milestoneUTC - now) / (60 * 1000);

    console.log(
        `📍 [${milestone.title}]`,
        "| IST:", milestone.timeFrom,
        "| UTC:", milestoneUTC.toISOString(),
        "| Diff:", Math.round(diffMinutes), "mins"
    );

    if (diffMinutes >= 0 && diffMinutes <= 1.5) {

        // ✅ Unique key per milestone per day
        const todayIST = new Date(now.getTime() + IST_OFFSET_MS)
            .toISOString().slice(0, 10);
        const lockKey = `${schedule._id}-${milestone._id}-${todayIST}`;

        // ✅ Check in-memory lock FIRST (instant, no DB delay)
        if (notifiedThisSession.has(lockKey)) {
            console.log(`⏭️  Skipping "${milestone.title}" — in-memory lock`);
            return null;
        }

        // ✅ Check DB flag as backup
        if (milestone.notifiedToday) {
            console.log(`⏭️  Skipping "${milestone.title}" — already notified today`);
            notifiedThisSession.add(lockKey);
            return null;
        }

        // ✅ Lock immediately before async operations
        notifiedThisSession.add(lockKey);

        const { title, body } = buildNotificationMessage(milestone, diffMinutes);

        await sendNotificationToUser(schedule.user, title, body);

        await Schedule.updateOne(
            { _id: schedule._id, "milestones._id": milestone._id },
            { $set: { "milestones.$.notifiedToday": true } }
        );

        console.log(`✅ Notified: "${milestone.title}"`);

        return {
            scheduleId: schedule._id,
            milestone,
            startsInMinutes: Math.round(diffMinutes),
        };
    }

    return null;
}

async function checkSchedules() {

    // ✅ Reset notifiedToday every midnight IST (18:30 UTC)
    cron.schedule("30 18 * * *", async () => {
        try {
            notifiedThisSession.clear();
            await Schedule.updateMany(
                {},
                { $set: { "milestones.$[].notifiedToday": false } }
            );
            console.log("🔄 Reset all notifiedToday flags");
        } catch (err) {
            console.error("❌ Failed to reset notifiedToday flags:", err.message);
        }
    });

    // ✅ Run every minute
    cron.schedule("*/1 * * * *", async () => {
        const now = new Date();
        console.log(`\n⏱️  Cron tick: ${now.toISOString()}`);

        try {
            const schedules = await Schedule.find({
                fromDate: { $lte: now },
                toDate: { $gte: now },
            });

            console.log(`📅 Active schedules: ${schedules.length}`);

            if (schedules.length === 0) return;

            // ✅ Process all milestones in parallel
            const results = await Promise.all(
                schedules.flatMap(schedule =>
                    (schedule.milestones || []).map(milestone =>
                        processMilestone(schedule, milestone, now)
                    )
                )
            );

            const fired = results.filter(Boolean);

            if (fired.length > 0) {
                console.log(`🔔 Notifications sent: ${fired.length}`);
            } else {
                console.log("💤 No milestones due right now");
            }

        } catch (err) {
            console.error("❌ Cron error:", err.message);
        }
    });
}

module.exports = checkSchedules;