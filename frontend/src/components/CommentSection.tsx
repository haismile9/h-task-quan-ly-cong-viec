import { useState, type FormEvent } from "react";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import { useComments, useCreateComment, useDeleteComment } from "../hooks/useComments";
import { getErrorMessage } from "../api/client";
import Avatar from "./ui/Avatar";
import ActivityItem from "./activity/ActivityItem";
import { useTaskActivities } from "../hooks/useActivities";
import type { Activity, Comment } from "../types";
import { useConfirm } from "./ui/ConfirmDialog";

/** Ô viết bình luận + danh sách bình luận (mới nhất trước), dùng trong chi tiết thẻ. */
interface CommentSectionProps {
  taskId: number;
  /** Hiện cả hoạt động của thẻ xen giữa bình luận ("Hiện chi tiết"). */
  showActivity?: boolean;
}

type FeedItem = { kind: "comment"; at: string; comment: Comment } | { kind: "activity"; at: string; activity: Activity };

const CommentSection = ({ taskId, showActivity = false }: CommentSectionProps) => {
  const { data: activityPage } = useTaskActivities(showActivity ? taskId : 0);
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

  // Dòng thời gian: bình luận (luôn hiện) + hoạt động (khi bật chi tiết), mới nhất trước
  const feed: FeedItem[] = [
    ...comments.map((c) => ({ kind: "comment" as const, at: c.created_at, comment: c })),
    ...(showActivity ? activityPage?.data ?? [] : [])
      .filter((a) => a.type !== "comment_added")
      .map((a) => ({ kind: "activity" as const, at: a.created_at, activity: a })),
  ].sort((x, y) => y.at.localeCompare(x.at));

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
      ) : feed.length === 0 ? (
        <p className="text-sm text-base-content/50">Chưa có bình luận nào.</p>
      ) : (
        <ul className="space-y-4">
          {feed.map((item) =>
            item.kind === "activity" ? (
              <ActivityItem key={`a-${item.activity.id}`} activity={item.activity} showContext={false} />
            ) : (
              <li key={`c-${item.comment.id}`} className="flex gap-2">
                <Avatar name={item.comment.user?.name ?? "?"} size="sm" className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{item.comment.user?.name}</span>{" "}
                    <span className="text-xs text-base-content/60">
                      {dayjs(item.comment.created_at).format("HH:mm DD/MM/YYYY")}
                    </span>
                  </p>
                  <div className="bg-base-100 rounded-lg px-3 py-2 mt-1 text-sm shadow-[0_1px_1px_#091e4240] whitespace-pre-line break-words">
                    {item.comment.content}
                  </div>
                  {item.comment.user_id === user?.id && (
                    <button
                      className="text-xs text-base-content/60 underline hover:text-error mt-1"
                      onClick={() => handleDelete(item.comment.id)}
                      disabled={deleteComment.isPending}
                    >
                      Xoá
                    </button>
                  )}
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
};

export default CommentSection;
