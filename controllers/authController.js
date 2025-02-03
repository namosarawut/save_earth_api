const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// 🔹 ลงทะเบียนผู้ใช้ใหม่
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, email, user_password, auth_type) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, "login"]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// 🔹 ล็อกอิน
exports.login = async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const [user] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
      if (user.length === 0) {
        return res.status(400).json({ message: "Invalid username or password" });
      }
  
      const isMatch = await bcrypt.compare(password, user[0].user_password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid username or password" });
      }
  
      const token = jwt.sign({ user_id: user[0].user_id, username: user[0].username }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      res.json({ token, user: user[0] });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };

// 🔹 Google Authentication
exports.googleAuth = async (req, res) => {
    const { uid, email } = req.body;
  
    try {
      // ค้นหาผู้ใช้ในฐานข้อมูล
      const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  
      if (user.length === 0) {
        // ถ้ายังไม่มีบัญชี ให้สร้างใหม่ (user_password เป็น NULL)
        await db.query(
          "INSERT INTO users (username, email, auth_type, user_password) VALUES (?, ?, ?, ?)",
          [uid, email, "google", null]
        );
      }
  
      // ดึงข้อมูลผู้ใช้ใหม่อีกครั้ง
      const [newUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  
      // สร้าง JWT Token
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      res.json({ token, user: newUser[0] });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  
