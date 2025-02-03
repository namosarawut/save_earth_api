const express = require("express");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const itemRoutes = require("./routes/items");
const requestRoutes = require("./routes/requests");


const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/items", itemRoutes);
app.use("/requests", requestRoutes);

app.listen(8080, () => console.log("Server running on port 8080"));
   