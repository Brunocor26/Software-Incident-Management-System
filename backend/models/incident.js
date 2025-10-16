import mongoose from "mongoose";

const IncidentSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category:    { type: String, enum: ["Infra","Aplicacao","Seguranca","Rede"], required: true },
    severity:    { type: String, enum: ["Low","Medium","High","Critical"], default: "Low" },
    status:      { type: String, enum: ["new","ack","in_progress","resolved","closed"], default: "new", index: true },
    assignee:    { type: mongoose.Types.ObjectId, ref: "User", default: null, index: true },
    createdBy:   { type: mongoose.Types.ObjectId, ref: "User", required: true },
    tags:        [{ type: String }],
    timeline:    [{ at:{type:Date,default:Date.now}, by:{type:mongoose.Types.ObjectId,ref:"User"}, action:String, note:String }],
    sla:         { targetHours:{type:Number,default:24}, breached:{type:Boolean,default:false}, resolvedAt:Date }
  },
  { timestamps: true }
);

IncidentSchema.index({ createdAt: -1 });
IncidentSchema.index({ title: "text", description: "text" });

export const Incident = mongoose.model("Incident", IncidentSchema);
