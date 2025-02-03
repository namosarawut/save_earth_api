const multer = require("multer");
const path = require("path");

// กำหนด storage สำหรับการอัปโหลดไฟล์
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

// ตรวจสอบประเภทไฟล์ที่อนุญาต
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed."), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไฟล์ไม่เกิน 5MB
    fileFilter,
});

module.exports = upload;
