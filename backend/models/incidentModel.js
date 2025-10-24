import mongoose from "mongoose";






const AttachmentSchema = new mongoose.Schema({


    filename: { type: String, required: true },


    url: { type: String, required: true }, // ex.: /uploads/<ficheiro>


    mimeType: { type: String },


    size: { type: Number },


    uploadedAt: { type: Date, default: Date.now },


    uploadedBy: { type: mongoose.Types.ObjectId, ref: "User", default: null }


}, { _id: false });





const IncidentSchema = new mongoose.Schema(


    {


        title: { type: String, required: true, trim: true },


        description: { type: String, default: "" },





        category: { type: String, enum: ["software", "network", "hardware"], required: true, index: true },


        status: { type: String, enum: ["open", "in-progress", "closed"], default: "open", index: true },


        priority: { type: String, enum: ["low", "medium", "high"], default: "low", index: true },





        assignedTo: { type: mongoose.Types.ObjectId, ref: "User", default: null, index: true },


        createdBy: { type: mongoose.Types.ObjectId, ref: "User", required: true, index: true },





        tags: [{ type: String }],


        attachments: [AttachmentSchema],





        timeline: [{


            at: { type: Date, default: Date.now },


            by: { type: mongoose.Types.ObjectId, ref: "User" },


            action: String,


            note: String


        }],





        sla: { targetHours: { type: Number, default: 24 }, breached: { type: Boolean, default: false }, resolvedAt: Date }


    },


    { timestamps: true }


);





// índices para listas/dashboard/pesquisa


IncidentSchema.index({ status: 1, createdAt: -1 });


IncidentSchema.index({ priority: 1, createdAt: -1 });


IncidentSchema.index({ title: "text", description: "text" });





export const Incident = mongoose.model("Incident", IncidentSchema);