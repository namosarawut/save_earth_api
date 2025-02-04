const express = require("express");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const itemRoutes = require("./routes/items");
const requestRoutes = require("./routes/requests");
const path = require("path");
 
const app = express();
app.use(express.json());
// ✅ เสิร์ฟโฟลเดอร์ `uploads/` ให้สามารถเข้าถึงรูปภาพที่อัปโหลดได้
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/items", itemRoutes);
app.use("/requests", requestRoutes);

app.listen(8080, () => console.log("Server running on port 8080"));
   