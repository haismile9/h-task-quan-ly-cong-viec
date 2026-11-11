import { useState, type FormEvent } from "react";
import { AiOutlineDelete, AiOutlineSend } from "react-icons/ai";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import { useComments, useCreateComment, useDeleteComment } from "../hooks/useComments";
import { getErrorMessage } from "../api/client";

interface CommentSectionProps {
  taskId: number;
}

const CommentSection = ({ taskId }: CommentSectionProps) => {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const [content, setContent] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    await createComment.mutateAsync(text);
    setContent("");
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">Bình luận ({comments.length})</h4>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="input input-bordered input-sm flex-1"
          placeholder="Viết bình luận..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!content.trim() || createComment.isPending}
          aria-label="Gửi bình luận"
        >
          <AiOutlineSend />
        </button>
      </form>
      {createComment.isError && (
        <p className="text-error text-xs">{getErrorMessage(createComment.error)}</p>
      )}

      {isLoading ? (
        <span className="loading loading-dots loading-sm" />
      ) : comments.length === 0 ? (
        <p className="text-sm text-base-content/50 italic">Chưa có bình luận nào.</p>
      ) : (
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <li key={c.id} className="bg-base-200 rounded-box p-3 text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{c.user?.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-base-content/50">
                    {dayjs(c.created_at).format("DD/MM/YYYY HH:mm")}
                  </span>
                  {c.user_id === user?.id && (
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => deleteComment.mutate(c.id)}
                      disabled={deleteComment.isPending}
                      aria-label="Xóa bình luận"
                    >
                      <AiOutlineDelete />
                    </button>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-line">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommentSection;
