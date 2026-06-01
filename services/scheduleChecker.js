import cron from "node-cron";
import mongoose from "mongoose";
import sendNotificationToUser from "./notification.js";
import Schedule from "../models/Schedule.js";

export default async function checkSchedules() {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    // Reset notifiedToday every midnight IST
    cron.schedule("30 18 * * *", async () => {
        await Schedule.updateMany(
            {},
            { $set: { "milestones.$[].notifiedToday": false } }
        );
        console.log("Reset all notifiedToday flags");
    });

    // Run every minute
    cron.schedule("*/1 * * * *", async () => {
        console.log("Checking database...");

        const now = new Date();

        const schedules = await Schedule.find({
            fromDate: { $lte: now },
            toDate: { $gte: now },
        });

        console.log(`Found ${schedules.length} active schedules to check.`);

        const upcomingMilestones = [];

        for (const schedule of schedules) {
            for (const milestone of schedule.milestones || []) {
                if (!milestone.timeFrom) continue;

                const [hours, minutes] = milestone.timeFrom.split(":").map(Number);

                if (
                    Number.isNaN(hours) ||
                    Number.isNaN(minutes) ||
                    hours < 0 ||
                    hours > 23 ||
                    minutes < 0 ||
                    minutes > 59
                ) {
                    continue;
                }

                // ✅ Convert IST milestone time to UTC for comparison
                const milestoneStart = new Date(now);
                milestoneStart.setUTCHours(hours, minutes, 0, 0);
                const milestoneUTC = new Date(milestoneStart.getTime() - IST_OFFSET_MS);

                const diffMinutes = (milestoneUTC - now) / (60 * 1000);

                console.log(
                    "Now (UTC):", now.toISOString(),
                    "| Milestone (IST):", milestone.timeFrom,
                    "| Milestone (UTC):", milestoneUTC.toISOString(),
                    "| Diff (mins):", Math.round(diffMinutes)
                );

                // ✅ Only notify once, within 1 minute window
                if (diffMinutes >= 0 && diffMinutes < 1) {
                    // ✅ Skip if already notified today
                    if (milestone.notifiedToday) {
                        console.log(`Milestone "${milestone.title}" already notified today, skipping.`);
                        continue;
                    }

                    upcomingMilestones.push({
                        scheduleId: schedule._id,
                        milestone,
                        startsInMinutes: Math.round(diffMinutes),
                    });

                    console.log(`Milestone "${milestone.title}" is starting now!`);

                    await sendNotificationToUser(
                        schedule.user,
                        "Milestone Reminder",
                        `Your milestone "${milestone.title}" is starting now!`
                    );

                    // ✅ Mark as notified to prevent duplicates
                    await Schedule.updateOne(
                        { _id: schedule._id, "milestones._id": milestone._id },
                        { $set: { "milestones.$.notifiedToday": true } }
                    );
                }
            }
        }

        if (upcomingMilestones.length > 0) {
            console.log("Upcoming milestones:", upcomingMilestones);
        }

        return upcomingMilestones;
    });
}