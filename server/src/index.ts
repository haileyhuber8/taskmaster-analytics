import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { loadData } from "./services/dataService";
import dataRoutes from "./routes/data";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Load data on startup
loadData();

// Routes
app.use("/api", dataRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "The Taskmaster is watching." });
});

app.listen(PORT, () => {
  console.log(`Taskmaster Analytics API running on port ${PORT}`);
});
