//Entry point for backend application
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectMongo } from "./db/mongo.js";
import incidents from "./routes/incidents.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/incidents", incidents);
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectMongo(process.env.MONGODB_URI);
    app.listen(PORT, () => console.log(`API em http://localhost:${PORT}`));
  } catch (err) {
    console.error("Falha a ligar ao Mongo:", err);
    process.exit(1);
  }
})();
