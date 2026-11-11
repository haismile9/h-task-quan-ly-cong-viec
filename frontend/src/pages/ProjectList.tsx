import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AiOutlineClockCircle, AiOutlineSearch, AiOutlineStar, AiOutlineUser } from "react-icons/ai";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../hooks/useProjects";
import { useStarredProjects } from "../hooks/useStarredProjects";
import { getErrorMessage } from "../api/client";
import Page, { Section } from "../components/ui/Page";
import EmptyState from "../components/ui/EmptyState";
import ProjectTile, { NewProjectTile } from "../components/projects/ProjectTile";
import CreateProjectModal from "../components/projects/CreateProjectModal";
import { useToast } from "../components/ui/Toast";
import { getRecentProjectIds } from "../utils/recentProjects";
import type { Project } from "../types";

const GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";

const ProjectList = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const { data: projects = [], isLoading, error } = useProjects();
  const { starred } = useStarredProjects();
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Thông báo truyền qua navigation state (vd. sau khi xoá dự án)
  useEffect(() => {
    if (!location.state?.message) return;
    toast.success(location.state.message);
    window.history.replaceState({}, document.title);
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = useMemo(() => {
    const byId = new Map(projects.map((p) => [p.id, p]));
    return (ids: number[]) => ids.map((id) => byId.get(id)).filter((p): p is Project => !!p);
  }, [projects]);

  if (!user) return null;

  const tiles = (list: Project[]) => list.map((p) => <ProjectTile key={p.id} project={p} />);

  if (isLoading) {
    return (
      <Page title="Bảng">
        <div className={GRID}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-[7.25rem] rounded-lg" />
          ))}
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Bảng">
        <div className="alert alert-error">{getErrorMessage(error, "Không thể tải dự án")}</div>
      </Page>
    );
  }

  // Đang tìm kiếm: chỉ hiện kết quả
  if (query) {
    const results = projects.filter((p) => p.name.toLowerCase().includes(query));
    return (
      <Page
        title={`Kết quả cho "${params.get("q")}"`}
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => setParams({})}>
            Xoá tìm kiếm
          </button>
        }
      >
        {results.length === 0 ? (
          <EmptyState icon={<AiOutlineSearch />} title="Không tìm thấy dự án phù hợp" />
        ) : (
          <div className={GRID}>{tiles(results)}</div>
        )}
      </Page>
    );
  }

  const starredProjects = pick(starred);
  const recentProjects = pick(getRecentProjectIds());

  return (
    <Page title="Bảng" subtitle={`Xin chào, ${user.name}`}>
      {starredProjects.length > 0 && (
        <Section icon={<AiOutlineStar />} title="Bảng đã gắn sao">
          <div className={GRID}>{tiles(starredProjects)}</div>
        </Section>
      )}

      {recentProjects.length > 0 && (
        <Section icon={<AiOutlineClockCircle />} title="Đã xem gần đây">
          <div className={GRID}>{tiles(recentProjects)}</div>
        </Section>
      )}

      <div className="border-t border-base-300 pt-8">
        <Section icon={<AiOutlineUser />} title="Các dự án của bạn">
          <div className={GRID}>
            {tiles(projects)}
            <NewProjectTile onClick={() => setShowCreateModal(true)} />
          </div>
        </Section>
      </div>

      {showCreateModal && <CreateProjectModal onClose={() => setShowCreateModal(false)} />}
    </Page>
  );
};

export default ProjectList;
