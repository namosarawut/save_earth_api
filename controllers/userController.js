const db = require("../config/db");

// 🔹 อัปเดตโปรไฟล์
exports.updateProfile = async (req, res) => {
  const { user_id, first_name, last_name, phone_number } = req.body;
  const profile_image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await db.query(
      "UPDATE users SET first_name = ?, last_name = ?, phone_number = ?, profile_image_url = ? WHERE user_id = ?",
      [first_name, last_name, phone_number, profile_image_url, user_id]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};



// 🔹 ดึงข้อมูลผู้ใช้ตาม user_id
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [id]);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
