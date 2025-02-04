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

// 3. GET: ดึงข้อมูล Items ตาม user_id และรวม requests
router.get("/user/:user_id", async (req, res) => {
    const { user_id } = req.params;
    try {
        const [items] = await db.query("SELECT * FROM items WHERE poster_user_id = ?", [user_id]);
        
        for (let item of items) {
            const [requests] = await db.query(
                `SELECT r.request_id, r.reason, r.status, r.created_at, 
                        u.user_id, u.username, u.first_name, u.last_name, u.phone_number 
                 FROM requests r 
                 JOIN users u ON r.user_id = u.user_id 
                 WHERE r.item_id = ?`, [item.item_id]
            );
            
            item.requests = requests.map(req => ({
                request_id: req.request_id,
                request_by: {
                    user_id: req.user_id,
                    username: req.username,
                    contact: {
                        first_name: req.first_name,
                        last_name: req.last_name,
                        phone_number: req.phone_number
                    }
                },
                reason: req.reason,
                status: req.status,
                created_at: req.created_at
            }));
        }
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});


// 4. PUT: อัปเดตข้อมูล Item
router.put("/:item_id", upload.single("image"), async (req, res) => {
    const { item_id } = req.params;
    const { name, category, description, latitude, longitude } = req.body;
    let image_url = null;
    
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }
    
    try {
        const query = image_url 
            ? "UPDATE items SET name = ?, category = ?, description = ?, latitude = ?, longitude = ?, image_url = ? WHERE item_id = ?"
            : "UPDATE items SET name = ?, category = ?, description = ?, latitude = ?, longitude = ? WHERE item_id = ?";
        
        const queryParams = image_url 
            ? [name, category, description, latitude, longitude, image_url, item_id] 
            : [name, category, description, latitude, longitude, item_id];
        
        await db.query(query, queryParams);
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
        let query = "SELECT *, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance FROM items WHERE status != 'taken' ";
        let queryParams = [latitude, longitude, latitude];
        
        if (name) {
            query += "AND name = ? ";
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
