const express = require("express");
const { updateProfile, getUserById } = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();


router.put("/update-profile", upload.single("profile_image"), updateProfile);
router.get("/:id", getUserById);

module.exports = router;
 