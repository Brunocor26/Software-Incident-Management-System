import mongoose from "mongoose";

export async function connectMongo(uri) {
  if (!uri) throw new Error("MONGODB_URI não definido");
  if (mongoose.connection.readyState >= 1) return;
  console.log("🔌 A ligar ao MongoDB…");
  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log("✅ MongoDB ligado");
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB erro:", err);
  });
}
