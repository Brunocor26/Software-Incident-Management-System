const mongoose = require('mongoose');
const User = require('../models/userModel');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: '../.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Create/Find User
        const email = "test_notify@example.com";
        const password = "password123";
        let user = await User.findOne({ email });
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await User.create({
                id: 9999, // Legacy ID
                name: "Test User Notification",
                email,
                password: hashedPassword,
                papel: "gestorSistemas"
            });
            console.log("User created");
        } else {
            console.log("User found");
        }

        // 2. Login
        const loginRes = await fetch("http://localhost:3000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${await loginRes.text()}`);
        }
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Got token");

        // 3. Create Incident
        // Create 3 incidents to test grouping
        for (let i = 0; i < 3; i++) {
            const res = await fetch("http://localhost:3000/api/incidents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: `Incident Notification Test ${i}`,
                    description: "Testing notification grouping",
                    category: "software",
                    priority: "high",
                    assignedTo: user._id // Assign to self to ensure notification
                })
            });
            if (!res.ok) throw new Error(`Create incident failed: ${await res.text()}`);
            console.log(`Incident ${i} created`);
        }

        console.log("Waiting 35 seconds for notification grouping...");
        await new Promise(r => setTimeout(r, 35000));

        console.log("Done waiting. Check server logs.");
        process.exit(0);

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

run();
