import comment from "../Modals/comment.js";
import mongoose from "mongoose";

export const postcomment = async (req, res) => {
  const commentdata = req.body;
  
  // Special characters validation
  const specialCharsRegex = /[@#$%^&*+=\[\]{}|\\<>\/~`]/;
  if (commentdata.commentbody && specialCharsRegex.test(commentdata.commentbody)) {
    return res.status(400).json({ message: "Comments containing special characters (@, #, $, etc.) are blocked." });
  }

  const postcomment = new comment(commentdata);
  try {
    await postcomment.save();
    return res.status(200).json({ comment: true, data: postcomment });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid: videoid });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("comment unavailable");
  }
  
  // Special characters validation
  const specialCharsRegex = /[@#$%^&*+=\[\]{}|\\<>\/~`]/;
  if (commentbody && specialCharsRegex.test(commentbody)) {
    return res.status(400).json({ message: "Comments containing special characters (@, #, $, etc.) are blocked." });
  }

  try {
    const updatecomment = await comment.findByIdAndUpdate(_id, {
      $set: { commentbody: commentbody },
    }, { new: true });
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const likecomment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const commentObj = await comment.findById(id);
    if (!commentObj) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!commentObj.likes) commentObj.likes = [];
    if (!commentObj.dislikes) commentObj.dislikes = [];

    const isLiked = commentObj.likes.includes(userId);
    const isDisliked = commentObj.dislikes.includes(userId);

    if (isLiked) {
      commentObj.likes = commentObj.likes.filter((uid) => uid.toString() !== userId);
    } else {
      commentObj.likes.push(userId);
      if (isDisliked) {
        commentObj.dislikes = commentObj.dislikes.filter((uid) => uid.toString() !== userId);
      }
    }

    await commentObj.save();
    return res.status(200).json(commentObj);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const dislikecomment = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).send("comment unavailable");
  }
  try {
    const commentObj = await comment.findById(id);
    if (!commentObj) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!commentObj.likes) commentObj.likes = [];
    if (!commentObj.dislikes) commentObj.dislikes = [];

    const isLiked = commentObj.likes.includes(userId);
    const isDisliked = commentObj.dislikes.includes(userId);

    if (isDisliked) {
      commentObj.dislikes = commentObj.dislikes.filter((uid) => uid.toString() !== userId);
    } else {
      commentObj.dislikes.push(userId);
      if (isLiked) {
        commentObj.likes = commentObj.likes.filter((uid) => uid.toString() !== userId);
      }
    }

    // Check if dislikes from OTHER users (excluding the comment author) is >= 2
    const otherDislikes = commentObj.dislikes.filter(
      (uid) => uid.toString() !== commentObj.userid.toString()
    );

    if (otherDislikes.length >= 2) {
      await comment.findByIdAndDelete(id);
      return res.status(200).json({ deleted: true });
    }

    await commentObj.save();
    return res.status(200).json(commentObj);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
