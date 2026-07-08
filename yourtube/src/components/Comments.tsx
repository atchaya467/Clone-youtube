import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  city?: string;
  likes?: string[];
  dislikes?: string[];
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "hi", name: "Hindi" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "ru", name: "Russian" },
];

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editCity, setEditCity] = useState("");
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingEditLocation, setIsEditingEditLocation] = useState(false);
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState("Seattle");

  // Translation States
  const [translations, setTranslations] = useState<{ [key: string]: { text: string; lang: string } }>({});
  const [translatingIds, setTranslatingIds] = useState<{ [key: string]: boolean }>({});
  const [selectedSourceLangs, setSelectedSourceLangs] = useState<{ [key: string]: string }>({});
  const [selectedLangs, setSelectedLangs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadComments();
    detectCity();
  }, [videoId]);

  const detectCity = async () => {
    try {
      console.log("Fetching location from backend server...");
      const res = await axiosInstance.get("/location");
      if (res.data && res.data.city) {
        console.log("Location detected from server:", res.data.city);
        setUserCity(res.data.city);
      }
    } catch (error) {
      console.error("Error fetching location from server, falling back to browser geolocation:", error);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const res = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              const data = await res.json();
              const city = data.city || data.locality || data.principalSubdivision;
              if (city) {
                setUserCity(city);
              }
            } catch (e) {
              console.error("Error reverse geocoding on client:", e);
            }
          },
          (error) => {
            console.warn("Browser geolocation permission denied or error:", error);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }
  };

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading history...</div>;
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    // Special characters validation
    const specialCharsRegex = /[@#$%^&*+=\[\]{}|\\<>\/~`]/;
    if (specialCharsRegex.test(newComment)) {
      toast.error("Comments containing special characters (@, #, $, etc.) are blocked!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        city: userCity,
      });
      if (res.data.comment) {
        const savedComment = res.data.data;
        const newCommentObj: Comment = {
          _id: savedComment?._id || Date.now().toString(),
          videoid: videoId,
          userid: user._id,
          commentbody: newComment,
          usercommented: user.name || "Anonymous",
          commentedon: savedComment?.commentedon || new Date().toISOString(),
          city: userCity,
          likes: savedComment?.likes || [],
          dislikes: savedComment?.dislikes || [],
        };
        setComments([newCommentObj, ...comments]);
        toast.success("Comment posted successfully!");
      }
      setNewComment("");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      const errMsg = error.response?.data?.message || "Error adding comment";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
    setEditCity(comment.city || "");
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;

    // Special characters validation
    const specialCharsRegex = /[@#$%^&*+=\[\]{}|\\<>\/~`]/;
    if (specialCharsRegex.test(editText)) {
      toast.error("Comments containing special characters (@, #, $, etc.) are blocked!");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText, city: editCity }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, commentbody: editText, city: editCity } : c
          )
        );
        if (editingCommentId) {
          handleShowOriginal(editingCommentId);
        }
        setEditingCommentId(null);
        setEditText("");
        setEditCity("");
        toast.success("Comment updated successfully!");
      }
    } catch (error: any) {
      console.log(error);
      const errMsg = error.response?.data?.message || "Error updating comment";
      toast.error(errMsg);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
        toast.success("Comment deleted.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error("Please login to like comments");
      return;
    }
    try {
      const res = await axiosInstance.post(`/comment/like/${commentId}`, {
        userId: user._id,
      });
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleDislikeComment = async (commentId: string) => {
    if (!user) {
      toast.error("Please login to dislike comments");
      return;
    }
    try {
      const res = await axiosInstance.post(`/comment/dislike/${commentId}`, {
        userId: user._id,
      });
      if (res.data.deleted) {
        toast.info("Comment automatically removed due to community dislikes.");
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      } else if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes }
              : c
          )
        );
      }
    } catch (error: any) {
      console.error("Error disliking comment:", error);
      if (error.response && error.response.status === 404) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    }
  };

  const handleTranslate = async (commentId: string, text: string) => {
    const sourceLang = selectedSourceLangs[commentId] || "en";
    const targetLang = selectedLangs[commentId] || "es";
    if (sourceLang === targetLang) {
      toast.error("Source and target languages must be different!");
      return;
    }
    setTranslatingIds((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=${sourceLang}|${targetLang}`
      );
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        setTranslations((prev) => ({
          ...prev,
          [commentId]: {
            text: data.responseData.translatedText,
            lang: targetLang,
          },
        }));
      } else {
        toast.error("Translation failed. Please try again.");
      }
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Error performing translation.");
    } finally {
      setTranslatingIds((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleShowOriginal = (commentId: string) => {
    setTranslations((prev) => {
      const updated = { ...prev };
      delete updated[commentId];
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>📍 Location:</span>
                {isEditingLocation ? (
                  <input
                    type="text"
                    value={userCity}
                    onChange={(e) => setUserCity(e.target.value)}
                    onBlur={() => setIsEditingLocation(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setIsEditingLocation(false);
                    }}
                    placeholder="City name"
                    className="px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-black bg-white w-28"
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => setIsEditingLocation(true)}
                    className="cursor-pointer hover:underline text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full font-medium"
                    title="Click to edit location"
                  >
                    {userCity || "Unknown Location"} (edit)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setNewComment("")}
                  disabled={!newComment.trim()}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>{comment.usercommented[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm">
                    {comment.usercommented}
                  </span>
                  {comment.city && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                      📍 {comment.city}
                    </span>
                  )}
                  <span className="text-xs text-gray-600">
                    • {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>📍 Location:</span>
                        {isEditingEditLocation ? (
                          <input
                            type="text"
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            onBlur={() => setIsEditingEditLocation(false)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setIsEditingEditLocation(false);
                            }}
                            placeholder="City name"
                            className="px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-black bg-white w-28"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => setIsEditingEditLocation(true)}
                            className="cursor-pointer hover:underline text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full font-medium"
                            title="Click to edit location"
                          >
                            {editCity || "Unknown Location"} (edit)
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateComment}
                          disabled={!editText.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditText("");
                            setEditCity("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">
                      {translations[comment._id] ? (
                        <span className="text-gray-800">
                          {translations[comment._id].text}
                          <span className="block text-xs text-gray-400 mt-1 italic">
                            (Translated to{" "}
                            {LANGUAGES.find(
                              (l) => l.code === translations[comment._id].lang
                            )?.name || translations[comment._id].lang}
                            )
                          </span>
                        </span>
                      ) : (
                        comment.commentbody
                      )}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        className={`flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors ${
                          comment.likes?.includes(user?._id)
                            ? "text-blue-600 font-bold"
                            : ""
                        }`}
                      >
                        <ThumbsUp
                          className={`w-3.5 h-3.5 ${
                            comment.likes?.includes(user?._id)
                              ? "fill-blue-600 text-blue-600"
                              : ""
                          }`}
                        />
                        <span>{comment.likes?.length || 0}</span>
                      </button>

                      {/* Dislike Button */}
                      <button
                        onClick={() => handleDislikeComment(comment._id)}
                        className={`flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors ${
                          comment.dislikes?.includes(user?._id)
                            ? "text-red-600 font-bold"
                            : ""
                        }`}
                      >
                        <ThumbsDown
                          className={`w-3.5 h-3.5 ${
                            comment.dislikes?.includes(user?._id)
                              ? "fill-red-600 text-red-600"
                              : ""
                          }`}
                        />
                        <span>{comment.dislikes?.length || 0}</span>
                      </button>

                      {/* Translation Options */}
                      <div className="flex items-center gap-1.5 border-l pl-3 border-gray-200 flex-wrap">
                        {translations[comment._id] ? (
                          <button
                            onClick={() => handleShowOriginal(comment._id)}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Show original
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-gray-400 text-[10px]">From:</span>
                            <select
                              value={selectedSourceLangs[comment._id] || "en"}
                              onChange={(e) =>
                                setSelectedSourceLangs((prev) => ({
                                  ...prev,
                                  [comment._id]: e.target.value,
                                }))
                              }
                              className="text-xs bg-transparent border border-gray-200 rounded px-1 py-0.5 focus:outline-none cursor-pointer hover:bg-gray-50"
                            >
                              {LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                  {lang.name}
                                </option>
                              ))}
                            </select>

                            <span className="text-gray-400 text-[10px]">To:</span>

                            <select
                              value={selectedLangs[comment._id] || "es"}
                              onChange={(e) =>
                                setSelectedLangs((prev) => ({
                                  ...prev,
                                  [comment._id]: e.target.value,
                                }))
                              }
                              className="text-xs bg-transparent border border-gray-200 rounded px-1 py-0.5 focus:outline-none cursor-pointer hover:bg-gray-50"
                            >
                              {LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                  {lang.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() =>
                                handleTranslate(comment._id, comment.commentbody)
                              }
                              disabled={translatingIds[comment._id]}
                              className="text-xs text-blue-600 hover:underline font-medium disabled:opacity-50"
                            >
                              {translatingIds[comment._id]
                                ? "Translating..."
                                : "Translate"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Edit / Delete (only for owner) */}
                      {comment.userid === user?._id && (
                        <div className="flex gap-2 border-l pl-3 border-gray-200">
                          <button
                            onClick={() => handleEdit(comment)}
                            className="hover:text-black dark:hover:text-white text-gray-500 dark:text-gray-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(comment._id)}
                            className="hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
