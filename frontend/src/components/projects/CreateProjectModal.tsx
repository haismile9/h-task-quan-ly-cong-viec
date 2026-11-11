import Modal from "../ui/Modal";
import ProjectForm from "./ProjectForm";
import type { Project } from "../../types";

interface Props {
  onClose: () => void;
  project?: Pick<Project, "id" | "name" | "description" | "background_url">;
}

/** Modal tạo/sửa dự án (dùng ở ô "Tạo dự án mới" và trang bảng). */
const CreateProjectModal = ({ onClose, project }: Props) => (
  <Modal title={project ? "Sửa dự án" : "Tạo dự án"} onClose={onClose} size="sm">
    <ProjectForm project={project} onDone={onClose} onCancel={onClose} />
  </Modal>
);

export default CreateProjectModal;
