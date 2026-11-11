import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi, type ProjectInput } from "../api/projects";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: number) => ["projects", id] as const,
};

export const useProjects = () => useQuery({ queryKey: projectKeys.all, queryFn: projectsApi.list });

export const useProject = (id: number) =>
  useQuery({ queryKey: projectKeys.detail(id), queryFn: () => projectsApi.get(id), enabled: id > 0 });

const useInvalidateProjects = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: projectKeys.all });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
};

export const useCreateProject = () => {
  const invalidate = useInvalidateProjects();
  return useMutation({ mutationFn: (input: ProjectInput) => projectsApi.create(input), onSuccess: invalidate });
};

export const useUpdateProject = () => {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ProjectInput }) =>
      projectsApi.update(id, input),
    onSuccess: invalidate,
  });
};

export const useDeleteProject = () => {
  const invalidate = useInvalidateProjects();
  return useMutation({ mutationFn: (id: number) => projectsApi.remove(id), onSuccess: invalidate });
};

export const useAddProjectMember = (projectId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => projectsApi.addMember(projectId, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
  });
};

export const useCancelInvitation = (projectId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: number) => projectsApi.cancelInvitation(projectId, invitationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
  });
};
