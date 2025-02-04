const express = require("express");
const db = require("../config/db");
const router = express.Router();

// 1. POST: ส่งคำร้องขอรับสิ่งของ
router.post("/", async (req, res) => {
    const { item_id, user_id, reason } = req.body;
    if (!item_id || !user_id || !reason) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    try {
        await db.query("INSERT INTO requests (item_id, user_id, reason, status) VALUES (?, ?, ?, 'pending')", [item_id, user_id, reason]);
        res.status(201).json({ message: "Request submitted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 2. GET: ดึงรายการขอรับของของผู้ใช้
router.get("/user/:user_id", async (req, res) => {
    const { user_id } = req.params;
    try {
        const [requests] = await db.query(
            `SELECT r.request_id, r.reason, r.status, r.created_at, 
                    i.item_id, i.name, i.image_url, i.category, i.latitude, i.longitude, 
                    u.user_id AS poster_user_id, u.username AS poster_username, u.first_name, u.last_name, u.phone_number 
             FROM requests r 
             JOIN items i ON r.item_id = i.item_id 
             JOIN users u ON i.poster_user_id = u.user_id 
             WHERE r.user_id = ?`, [user_id]
        );
        
        const formattedRequests = requests.map(req => ({
            request_id: req.request_id,
            item: {
                item_id: req.item_id,
                name: req.name,
                image_url: req.image_url,
                category: req.category,
                latitude: req.latitude,
                longitude: req.longitude,
                posted_by: {
                    user_id: req.poster_user_id,
                    username: req.poster_username,
                    contact: {
                        first_name: req.first_name,
                        last_name: req.last_name,
                        phone_number: req.phone_number
                    }
                }
            },
            reason: req.reason,
            status: req.status,
            created_at: req.created_at
        }));
        
        res.json(formattedRequests);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 3. PUT: แก้ไขเหตุผลการร้องขอ
router.put("/:request_id", async (req, res) => {
    const { request_id } = req.params;
    const { reason } = req.body;
    if (!reason) {
        return res.status(400).json({ message: "Missing reason field" });
    }
    try {
        await db.query("UPDATE requests SET reason = ? WHERE request_id = ?", [reason, request_id]);
        res.json({ message: "Request updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 4. DELETE: ลบคำร้องขอ
router.delete("/:request_id", async (req, res) => {
    const { request_id } = req.params;
    try {
        await db.query("DELETE FROM requests WHERE request_id = ?", [request_id]);
        res.json({ message: "Request deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// 5. POST: อนุมัติการให้ของ
router.post("/approve", async (req, res) => {
    const { item_id, request_id } = req.body;
    if (!item_id || !request_id) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    try {
        await db.query("UPDATE items SET status = 'taken' WHERE item_id = ?", [item_id]);
        await db.query("UPDATE requests SET status = 'approved' WHERE request_id = ?", [request_id]);
        await db.query("UPDATE requests SET status = 'rejected' WHERE item_id = ? AND request_id != ?", [item_id, request_id]);
        res.json({ message: "Item approved successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

module.exports = router;
