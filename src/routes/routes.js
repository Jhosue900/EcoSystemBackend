const { Router } = require('express');
const multer = require('multer');
const { register, login, createDonation, getMyDonations } = require('../controllers/controllers.js');
const { verifyToken } = require('../middleware/auth.js');

const router = Router();

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; 

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE, files: MAX_IMAGES },
    fileFilter: (req, file, cb) => {
        if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Only JPG and PNG images are allowed'));
    },
});

const uploadImages = (req, res, next) => {
    upload.array('images', MAX_IMAGES)(req, res, (err) => {
        if (err) {
            const message =
                err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 10MB or smaller'
                : err.code === 'LIMIT_UNEXPECTED_FILE' ? `You can upload up to ${MAX_IMAGES} images`
                : err.message;
            return res.status(400).json({ error: message });
        }
        next();
    });
};

router.post('/register', register);
router.post('/login', login);
router.post('/createDonation', verifyToken, uploadImages, createDonation);
router.get('/myDonations', verifyToken, getMyDonations);

module.exports = router;