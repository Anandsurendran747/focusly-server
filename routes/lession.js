const router = require('express').Router();


const Lesson = require('../models/Lession');
const auth = require('../middlewares/auth');

router.get('/', auth, async (req, res) => {
    try {
        const lessons = await Lesson.find({ user: req.user.id }); // Assuming req.user is set by auth middleware
        res.json(lessons);
    } catch (error) {
        console.error("Error fetching lessons:", error);
        res.status(500).json({ message: 'Server error during lesson fetching' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { title, content, category, date, emoji } = req.body;
        const lesson = new Lesson({ title, content, category, date, emoji, user: req.user.id });
        await lesson.save();
        res.status(201).json(lesson);
    } catch (error) {
        console.error("Error creating lesson:", error);
        res.status(500).json({ message: 'Server error during lesson creation' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const lesson = await Lesson.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.json({ message: 'Lesson deleted' });
    } catch (error) {
        console.error("Error deleting lesson:", error);
        res.status(500).json({ message: 'Server error during lesson deletion' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { title, content, category, date, emoji } = req.body;
        const lesson = await Lesson.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { title, content, category, date, emoji },
            { new: true }
        );
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.json(lesson);
    }
    catch (error) {
        console.error("Error updating lesson:", error);
        res.status(500).json({ message: 'Server error during lesson update' });
    }
});



module.exports = router;