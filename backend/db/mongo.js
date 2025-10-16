import mongoose from "mongoose";

export async function connectMongo(uri) {
  if (!uri) throw new Error("MONGODB_URI não definido");
  if (mongoose.connection.readyState >= 1) return; // já ligado
  await mongoose.connect(uri, { autoIndex: true });
  console.log("✅ MongoDB ligado");
}
