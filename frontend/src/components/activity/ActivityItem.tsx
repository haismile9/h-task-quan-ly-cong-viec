import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import Avatar from "../ui/Avatar";
import type { Activity } from "../../types";

dayjs.extend(relativeTime);

const B = ({ children }: { children: ReactNode }) => <span className="font-semibold">{children}</span>;

/** Câu mô tả một hoạt động, giống Trello: "X đã thêm thẻ Y vào danh sách Z". */
export const describeActivity = (a: Activity, opts: { showCard: boolean }): ReactNode => {
  const d = a.data;
  const card = opts.showCard ? (
    a.task_id && a.type !== "card_deleted" ? (
      <Link to={`/projects/${a.project_id}?card=${a.task_id}`} className="link link-primary">
        {d.task_title}
      </Link>
    ) : (
      <B>{d.task_title}</B>
    )
  ) : (
    "thẻ này"
  );
  const thẻ = opts.showCard ? <>thẻ {card}</> : card;
  const isSelf = d.member_id === a.user.id;

  switch (a.type) {
    case "project_created":
      return <>đã tạo bảng</>;
    case "member_added":
      return <>đã thêm <B>{d.member_name}</B> vào bảng</>;
    case "member_invited":
      return <>đã mời <B>{d.email}</B> vào bảng</>;
    case "list_created":
      return <>đã thêm danh sách <B>{d.list_name}</B></>;
    case "list_renamed":
      return <>đã đổi tên danh sách <B>{d.old_name}</B> thành <B>{d.list_name}</B></>;
    case "list_deleted":
      return <>đã xoá danh sách <B>{d.list_name}</B>{Number(d.card_count) > 0 && <> ({d.card_count} thẻ)</>}</>;
    case "card_created":
      return <>đã thêm {thẻ} vào danh sách <B>{d.list_name}</B></>;
    case "card_moved":
      return <>đã chuyển {thẻ} từ <B>{d.from_list}</B> sang <B>{d.to_list}</B></>;
    case "card_completed":
      return <>đã đánh dấu {thẻ} là hoàn thành</>;
    case "card_reopened":
      return <>đã đánh dấu {thẻ} là chưa hoàn thành</>;
    case "card_renamed":
      return <>đã đổi tên {thẻ} (trước đây: <B>{d.old_title}</B>)</>;
    case "card_deleted":
      return <>đã xoá thẻ <B>{d.task_title}</B></>;
    case "card_due_changed":
      return d.deadline ? (
        <>đã đặt hạn {thẻ} vào <B>{dayjs(String(d.deadline)).format("DD/MM/YYYY")}</B></>
      ) : (
        <>đã gỡ hạn chót của {thẻ}</>
      );
    case "card_member_added":
      return isSelf ? <>đã tham gia {thẻ}</> : <>đã thêm <B>{d.member_name}</B> vào {thẻ}</>;
    case "card_member_removed":
      return isSelf ? <>đã rời khỏi {thẻ}</> : <>đã loại <B>{d.member_name}</B> khỏi {thẻ}</>;
    case "comment_added":
      return <>đã bình luận về {thẻ}</>;
    default:
      return <>đã cập nhật {thẻ}</>;
  }
};

interface ActivityItemProps {
  activity: Activity;
  /** Hiện tên thẻ và bảng (trang Hoạt động); ẩn trong chi tiết thẻ. */
  showContext?: boolean;
}

const ActivityItem = ({ activity: a, showContext = true }: ActivityItemProps) => (
  <li className="flex gap-3">
    <Avatar name={a.user.name} size="sm" className="shrink-0 mt-0.5" />
    <div className="min-w-0 text-sm">
      <p>
        <span className="font-semibold">{a.user.name}</span> {describeActivity(a, { showCard: showContext })}
      </p>
      {a.type === "comment_added" && a.data.excerpt && (
        <p className="mt-1 bg-base-100 border border-base-300 rounded-lg px-3 py-2 text-base-content/80 line-clamp-3">
          {a.data.excerpt}
        </p>
      )}
      <p className="text-xs text-base-content/60 mt-0.5">
        <time title={dayjs(a.created_at).format("HH:mm DD/MM/YYYY")}>{dayjs(a.created_at).locale("vi").fromNow()}</time>
        {showContext && a.project && (
          <>
            {" "}· trên bảng{" "}
            <Link to={`/projects/${a.project.id}`} className="link link-primary font-medium">
              {a.project.name}
            </Link>
          </>
        )}
      </p>
    </div>
  </li>
);

export default ActivityItem;
