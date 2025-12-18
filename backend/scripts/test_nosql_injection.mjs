import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("Starting NoSQL Injection Test...");

try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // 2. Mock the sanitization helpers (identical to what's in incidents.js)
    const clean = {
        str: v => (typeof v === "string" ? v : ""),
        id: v => (mongoose.Types.ObjectId.isValid(v) ? v : null),
        tags: v => (Array.isArray(v) ? v.filter(t => typeof t === "string").map(t => t.trim()) : [])
    };

    // 3. Simulate a NoSQL Injection attempt via filter
    const maliciousInput = { $ne: null };
    
    console.log("\n--- Testing ObjectId Sanitization ---");
    console.log("Input:", JSON.stringify(maliciousInput));
    const sanitizedId = clean.id(maliciousInput);
    console.log("Sanitized result:", sanitizedId);
    if (sanitizedId === null) {
        console.log("✅ Success: Malicious object neutralized to null.");
    } else {
        console.error("❌ Failure: Malicious object was NOT neutralized.");
    }

    console.log("\n--- Testing String Sanitization ---");
    const maliciousSearch = { $gt: "" };
    console.log("Input:", JSON.stringify(maliciousSearch));
    const sanitizedSearch = clean.str(maliciousSearch);
    console.log("Sanitized result:", JSON.stringify(sanitizedSearch));
    if (sanitizedSearch === "") {
        console.log("✅ Success: Malicious object neutralized to empty string.");
    } else {
        console.error("❌ Failure: Malicious object was NOT neutralized.");
    }

    console.log("\n--- Testing Tags Sanitization ---");
    const maliciousTags = [{ $ne: "test" }, "valid-tag"];
    console.log("Input:", JSON.stringify(maliciousTags));
    const sanitizedTags = clean.tags(maliciousTags);
    console.log("Sanitized result:", JSON.stringify(sanitizedTags));
    if (sanitizedTags.length === 1 && sanitizedTags[0] === "valid-tag") {
        console.log("✅ Success: Malicious elements in array neutralized.");
    } else {
        console.error("❌ Failure: Malicious elements were NOT neutralized.");
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
} catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
}
