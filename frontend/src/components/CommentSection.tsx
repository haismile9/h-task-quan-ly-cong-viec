import { useState, type FormEvent } from "react";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import { useComments, useCreateComment, useDeleteComment } from "../hooks/useComments";
import { getErrorMessage } from "../api/client";
import Avatar from "./ui/Avatar";
import { useConfirm } from "./ui/ConfirmDialog";

/** Ô viết bình luận + danh sách bình luận (mới nhất trước), dùng trong chi tiết thẻ. */
const CommentSection = ({ taskId }: { taskId: number }) => {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const confirm = useConfirm();
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = content.trim();
    if (!text) return;
    try {
      await createComment.mutateAsync(text);
      setContent("");
      setFocused(false);
    } catch {
      // Lỗi hiển thị bên dưới ô nhập
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: "Xoá bình luận", message: "Xoá bình luận này?", confirmText: "Xoá", danger: true });
    if (ok) deleteComment.mutate(id);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit}>
        <textarea
          rows={focused ? 3 : 1}
          className="textarea w-full text-sm bg-base-100 shadow-[0_1px_1px_#091e4240] resize-none"
          placeholder="Viết bình luận…"
          value={content}
          onFocus={() => setFocused(true)}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
          }}
        />
        {focused && (
          <div className="flex items-center gap-2 mt-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={!content.trim() || createComment.isPending}>
              Lưu
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setContent("");
                setFocused(false);
              }}
            >
              Huỷ
            </button>
            <span className="text-xs text-base-content/50 ml-auto">Ctrl + Enter để gửi</span>
          </div>
        )}
        {createComment.isError && <p className="text-error text-xs mt-1">{getErrorMessage(createComment.error)}</p>}
      </form>

      {isLoading ? (
        <span className="loading loading-dots loading-sm" />
      ) : comments.length === 0 ? (
        <p className="text-sm text-base-content/50">Chưa có bình luận nào.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2">
              <Avatar name={c.user?.name ?? "?"} size="sm" className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{c.user?.name}</span>{" "}
                  <span className="text-xs text-base-content/60">{dayjs(c.created_at).format("HH:mm DD/MM/YYYY")}</span>
                </p>
                <div className="bg-base-100 rounded-lg px-3 py-2 mt-1 text-sm shadow-[0_1px_1px_#091e4240] whitespace-pre-line break-words">
                  {c.content}
                </div>
                {c.user_id === user?.id && (
                  <button
                    className="text-xs text-base-content/60 underline hover:text-error mt-1"
                    onClick={() => handleDelete(c.id)}
                    disabled={deleteComment.isPending}
                  >
                    Xoá
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommentSection;
