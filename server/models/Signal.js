import mongoose from "mongoose";

const signalSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["offer", "answer", "candidate", "leave", "screenshare"],
    required: true,
  },
  sender: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Automatically delete after 5 minutes
  }
});

const Signal = mongoose.model("Signal", signalSchema);
export default Signal;
