import multer from 'multer';
import path from 'path';

// Set storage options for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Folder to store uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
        return cb(new Error('Only images are allowed'), false);
    }
    cb(null, true);
};

// Initialize multer
export const upload = multer({
    storage,
    fileFilter
});
