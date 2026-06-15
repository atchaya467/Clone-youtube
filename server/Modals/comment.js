import mongoose from "mongoose";
const commentschema = mongoose.Schema(
  {
    userid: {
      type: String,
      required: true,
    },
    videoid: {
      type: String,
      required: true,
    },
    commentbody: { type: String },
    usercommented: { type: String },
    commentedon: { type: Date, default: Date.now },
    city: { type: String, default: "Unknown City" },
    likes: { type: [String], default: [] },
    dislikes: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentschema);
