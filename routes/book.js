const router = require('express').Router();

const Book = require('../models/Book');
const auth = require('../middlewares/auth');


router.get('/', auth, async (req, res) => {
    try {
        const books = await Book.find({ user: req.user.id }); // Assuming req.user is set by auth middleware
        res.json(books);
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({ message: 'Server error during book fetching' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { title, author, description, status, genre, dateRead, keyTakeaways, cover } = req.body;
        const book = new Book({ title, author, description, status, genre, user: req.user.id, dateRead, keyTakeaways, cover });
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        console.error("Error creating book:", error);
        res.status(500).json({ message: 'Server error during book creation' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const book = await Book.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json({ message: 'Book deleted' });
    }

    catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({ message: 'Server error during book deletion' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { title, author, description, status, genre, dateRead, keyTakeaways, cover } = req.body;
        const book = await Book.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { title, author, description, status, genre, dateRead, keyTakeaways, cover },
            { new: true }
        );
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        console.error("Error updating book:", error);
        res.status(500).json({ message: 'Server error during book update' });
    }
});


module.exports = router;