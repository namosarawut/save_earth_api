const db = require("../config/db");

// 1. สร้าง Item ใหม่
exports.createItem = async (req, res) => {
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
};

// 2. ดึงข้อมูล Items ทั้งหมด
exports.getAllItems = async (req, res) => {
    try {
        const [items] = await db.query("SELECT * FROM items");
        res.json({ items });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// 3. ดึงข้อมูล Items ตาม user_id
exports.getItemsByUserId = async (req, res) => {
    const { user_id } = req.params;
    try {
        const [items] = await db.query("SELECT * FROM items WHERE poster_user_id = ?", [user_id]);
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// 4. อัปเดตข้อมูล Item
exports.updateItem = async (req, res) => {
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
};

// 5. ลบ Item
exports.deleteItem = async (req, res) => {
    const { item_id } = req.params;
    try {
        await db.query("DELETE FROM items WHERE item_id = ?", [item_id]);
        res.json({ message: "Item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// 6. ดึงชื่อ Item ที่ไม่ซ้ำกัน
exports.getUniqueItemNames = async (req, res) => {
    try {
        const [names] = await db.query("SELECT DISTINCT name FROM items");
        res.json(names.map(item => item.name));
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// 7. ค้นหา Item ตามชื่อและระยะทาง
exports.searchItems = async (req, res) => {
    const { name, latitude, longitude } = req.query;
    if (!name || !latitude || !longitude) {
        return res.status(400).json({ message: "Missing required parameters" });
    }
    try {
        const [items] = await db.query(
            "SELECT *, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance FROM items WHERE name = ? ORDER BY distance ASC",
            [latitude, longitude, latitude, name]
        );
        res.json({ items });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
