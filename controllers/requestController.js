const db = require("../config/db");

// 1. ส่งคำร้องขอรับสิ่งของ
exports.createRequest = async (req, res) => {
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
};

// 2. ดึงรายการขอรับของของผู้ใช้
exports.getRequestsByUserId = async (req, res) => {
    const { user_id } = req.params;
    try {
        const [requests] = await db.query("SELECT * FROM requests WHERE user_id = ?", [user_id]);
        res.json({ requests });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// 3. แก้ไขเหตุผลการร้องขอ
exports.updateRequest = async (req, res) => {
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
};

// 4. ลบคำร้องขอ
exports.deleteRequest = async (req, res) => {
    const { request_id } = req.params;
    try {
        await db.query("DELETE FROM requests WHERE request_id = ?", [request_id]);
        res.json({ message: "Request deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// 5. อนุมัติการให้ของ
exports.approveRequest = async (req, res) => {
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
};
