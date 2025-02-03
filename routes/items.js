const express = require("express");
const db = require("../config/db");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();

// 1. POST: สร้าง Item ใหม่
router.post("/", upload.single("image"), async (req, res) => {
    const { name, category, description, latitude, longitude, poster_user_id } = req.body;
    if (!name || !category || !description || !latitude || !longitude || !req.file) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const image_url = `/uploads/${req.file.filename}`;
        await db.query(
            "INSERT INTO items (name, image_url, category, description, latitude, longitude, status, poster_user_id) VALUES (?, ?, ?, ?, ?, ?, 'available', ?)",
            [name, image_url, category, description, latitude, longitude, poster_user_id]
        );
        res.status(201).json({ message: "Item created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 2. GET: ดึงข้อมูล Items ทั้งหมด
router.get("/", async (req, res) => {
    try {
        const [items] = await db.query("SELECT * FROM items");
        res.json({ items });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 3. GET: ดึงข้อมูล Items ตาม user_id
router.get("/user/:user_id", async (req, res) => {
    const { user_id } = req.params;
    try {
        const [items] = await db.query("SELECT * FROM items WHERE poster_user_id = ?", [user_id]);
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 4. PUT: อัปเดตข้อมูล Item
router.put("/:item_id", async (req, res) => {
    const { item_id } = req.params;
    const { name, category, description, latitude, longitude } = req.body;
    try {
        await db.query(
            "UPDATE items SET name = ?, category = ?, description = ?, latitude = ?, longitude = ? WHERE item_id = ?",
            [name, category, description, latitude, longitude, item_id]
        );
        res.json({ message: "Item updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 5. DELETE: ลบ Item
router.delete("/:item_id", async (req, res) => {
    const { item_id } = req.params;
    try {
        await db.query("DELETE FROM items WHERE item_id = ?", [item_id]);
        res.json({ message: "Item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 6. GET: ดึงชื่อ Item ที่ไม่ซ้ำกัน
router.get("/unique-names", async (req, res) => {
    try {
        const [names] = await db.query("SELECT DISTINCT name FROM items");
        res.json(names.map(item => item.name));
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 7. GET: ค้นหา Item ตามชื่อและระยะทาง
router.get("/search", async (req, res) => {
    const { name, latitude, longitude } = req.query;
    if (!latitude || !longitude) {
        return res.status(400).json({ message: "Missing required latitude and longitude" });
    }
    try {
        let query = "SELECT *, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance FROM items ";
        let queryParams = [latitude, longitude, latitude];
        
        if (name) {
            query += "WHERE name = ? ";
            queryParams.push(name);
        }
        query += "ORDER BY distance ASC";
        
        const [items] = await db.query(query, queryParams);
        res.json({ items });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

module.exports = router;
