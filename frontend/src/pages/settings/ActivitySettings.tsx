import { AiOutlineHistory } from "react-icons/ai";
import { useMyActivities } from "../../hooks/useActivities";
import { getErrorMessage } from "../../api/client";
import ActivityItem from "../../components/activity/ActivityItem";
import EmptyState from "../../components/ui/EmptyState";

/** Trang "Hoạt động": mọi việc bạn đã làm trên các bảng, mới nhất trước. */
const ActivitySettings = () => {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyActivities();
  const items = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <h1 className="text-3xl font-bold mb-8">Hoạt động</h1>
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <AiOutlineHistory className="text-xl" /> Hoạt động
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-box" />
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error">{getErrorMessage(error, "Không tải được hoạt động.")}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<AiOutlineHistory />} title="Chưa có hoạt động nào" description="Các thao tác trên bảng và thẻ sẽ hiện ở đây." />
      ) : (
        <>
          <ul className="space-y-5 pl-1">
            {items.map((a) => (
              <ActivityItem key={a.id} activity={a} />
            ))}
          </ul>
          {hasNextPage && (
            <button className="btn btn-sm mt-6" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage && <span className="loading loading-spinner loading-xs" />}
              Tải thêm hoạt động
            </button>
          )}
        </>
      )}
    </>
  );
};

export default ActivitySettings;
