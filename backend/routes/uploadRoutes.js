const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const protocol = req.protocol;
    const host = req.get('host');
    const fullPath = `${protocol}://${host}/${req.file.path.replace(/\\/g, '/')}`;

    res.send({ url: fullPath });
});

module.exports = router;
