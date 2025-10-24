import dotenv from "dotenv"; dotenv.config();
import { connectMongo } from "../db/mongo.js";
import { Incident } from "../models/Incident.js";

await connectMongo(process.env.MONGODB_URI);

// mapeamentos (dados antigos -> novos valores do HTML)
const catMap = { aplicacao: "software", software:"software", rede:"network", network:"network", infra:"hardware", hardware:"hardware" };
const stMap  = { "in_progress":"in-progress", "in-progress":"in-progress", open:"open", closed:"closed" };
const prMap  = { low:"low", medium:"medium", high:"high", critical:"high" };

const docs = await Incident.find({});
const ops = [];

for (const d of docs) {
  const upd = {};

  if (d.category && catMap[String(d.category).toLowerCase()] && d.category !== catMap[String(d.category).toLowerCase()]) {
    upd.category = catMap[String(d.category).toLowerCase()];
  }
  if (d.status && stMap[String(d.status).toLowerCase()] && d.status !== stMap[String(d.status).toLowerCase()]) {
    upd.status = stMap[String(d.status).toLowerCase()];
  }
  if (d.priority && prMap[String(d.priority).toLowerCase()] && d.priority !== prMap[String(d.priority).toLowerCase()]) {
    upd.priority = prMap[String(d.priority).toLowerCase()];
  }
  if (!d.priority && d.severity) {
    // migrar severity -> priority
    const sev = String(d.severity).toLowerCase();
    upd.priority = prMap[sev] || "low";
  }
  if (d.severity != null) {
    upd.$unset = { ...(upd.$unset || {}), severity: 1 };
  }

  if (Object.keys(upd).length) {
    ops.push({ updateOne: { filter: { _id: d._id }, update: upd } });
  }
}

if (ops.length) {
  const res = await Incident.bulkWrite(ops);
  console.log("Migrated:", res.modifiedCount);
} else {
  console.log("Nada para migrar");
}

process.exit(0);