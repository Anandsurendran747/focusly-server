import cron from "node-cron";
import mongoose from "mongoose";
import sendNotificationToUser from "./notification.js";


let Schedule;
try {
    Schedule = mongoose.model("Schedule");
} catch (error) {
    Schedule = require("../models/schedule");
}

export default async function checkSchedules() {
    // Run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
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

                const milestoneStart = new Date(now);
                milestoneStart.setHours(hours, minutes, 0, 0);

                const diffMinutes = (milestoneStart - now) / (60 * 1000);
                if (diffMinutes >= -5 && diffMinutes <= 5) {
                    upcomingMilestones.push({
                        scheduleId: schedule._id,
                        milestone,
                        startsInMinutes: Math.round(diffMinutes),
                    });
                    console.log(`Milestone "${milestone.title}" starts in ${Math.round(diffMinutes)} minutes!`);

                    await sendNotificationToUser(
                        schedule.user,
                        "Milestone Reminder",
                        `Your milestone "${milestone.title}" starts in ${Math.round(diffMinutes)} minutes!`
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