const router = require('express').Router();

const Schedule = require('../models/Schedule');
const auth = require('../middlewares/auth');

router.get('/', auth, async (req, res) => {
    console.log("Fetching schedules for user:", req.user.id);
    try {
        const schedules = await Schedule.find({ user: req.user.id }); // Assuming req.user is set by auth middleware
        res.json(schedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);
        res.status(500).json({ message: 'Server error during schedule fetching' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { title, milestones, priority, fromDate, toDate } = req.body;

        const schedule = new Schedule({
            user: req.user.id,
            title,
            milestones,
            priority,
            fromDate,
            toDate
        });

        const savedSchedule = await schedule.save();
        res.status(201).json(savedSchedule);
    } catch (error) {
        console.error("Error creating schedule:", error);
        res.status(500).json({ message: 'Server error during schedule creation' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json({ message: 'Schedule deleted' });
    } catch (error) {
        console.error("Error deleting schedule:", error);
        res.status(500).json({ message: 'Server error during schedule deletion' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { title, milestones, priority, fromDate, toDate } = req.body;
        const schedule = await Schedule.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { title, milestones, priority, fromDate, toDate },
            { new: true }
        );
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json(schedule);
    }
    catch (error) {
        console.error("Error updating schedule:", error);
        res.status(500).json({ message: 'Server error during schedule update' });
    }
});

module.exports = router;