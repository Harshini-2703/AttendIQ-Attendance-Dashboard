const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");


require("dotenv").config();
const studentRoutes = require("./routes/studentRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Attendance Dashboard with Analytics",
    generatedAt: new Date().toISOString(),
  });
});

app.use("/api/students", studentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Attendance dashboard running on http://localhost:${PORT}`);
  console.log("Connected to Supabase");
});
