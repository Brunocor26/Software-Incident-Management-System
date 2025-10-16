import dotenv from "dotenv"; dotenv.config();
import { connectMongo } from "../db/mongo.js";
import { Incident } from "../models/Incident.js";
await connectMongo(process.env.MONGODB_URI);
await Incident.syncIndexes();
console.log("✅ Indexes sincronizados"); process.exit(0);