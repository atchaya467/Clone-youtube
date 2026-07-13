import Signal from "../models/Signal.js";

export const postSignal = async (req, res) => {
  const { roomName, type, sender, data } = req.body;

  if (!roomName || !type || !sender || !data) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newSignal = new Signal({
      roomName,
      type,
      sender,
      data,
    });
    await newSignal.save();
    res.status(201).json({ success: true, signal: newSignal });
  } catch (err) {
    console.error("Error saving signaling message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSignals = async (req, res) => {
  const { roomName, sender, lastSeenTime } = req.query;

  if (!roomName) {
    return res.status(400).json({ message: "roomName is required" });
  }

  try {
    const query = { roomName };
    
    // Filter out signals sent by self
    if (sender) {
      query.sender = { $ne: sender };
    }

    // Filter by timestamp if provided
    if (lastSeenTime) {
      query.createdAt = { $gt: new Date(Number(lastSeenTime)) };
    }

    const signals = await Signal.find(query).sort({ createdAt: 1 });
    res.status(200).json({ success: true, signals });
  } catch (err) {
    console.error("Error retrieving signaling messages:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const clearRoom = async (req, res) => {
  const { roomName } = req.body;

  if (!roomName) {
    return res.status(400).json({ message: "roomName is required" });
  }

  try {
    await Signal.deleteMany({ roomName });
    res.status(200).json({ success: true, message: "Room signals cleared" });
  } catch (err) {
    console.error("Error clearing room signaling messages:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
