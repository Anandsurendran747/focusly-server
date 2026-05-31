
const auth = require('../middlewares/auth');
const Todo = require('../models/Todo');

const router = require('express').Router();


router.get('/', auth, async (req, res) => {
    try {
        const todos = await Todo.find({ user: req.user.id }); // Assuming req.user is set by auth middleware
        res.json(todos);
    } catch (error) {
        console.error("Error fetching todos:", error);
        res.status(500).json({ message: 'Server error during todo fetching' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { title, description, completed, priority, startDate, endDate, dueDate, periodType,tags } = req.body;
        const todo = new Todo({ title, description, completed, priority, startDate, endDate, dueDate, periodType, tags, user: req.user.id });
        await todo.save();
        res.status(201).json(todo);
    } catch (error) {
        console.error("Error creating todo:", error);
        res.status(500).json({ message: 'Server error during todo creation' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        res.json({ message: 'Todo deleted' });
    } catch (error) {
        console.error("Error deleting todo:", error);
        res.status(500).json({ message: 'Server error during todo deletion' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { completed } = req.body;
        const todo = await Todo.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { completed },
            { new: true }
        );
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        res.json(todo);
    } catch (error) {
        console.error("Error updating todo:", error);
        res.status(500).json({ message: 'Server error during todo update' });
    }
});



module.exports = router;