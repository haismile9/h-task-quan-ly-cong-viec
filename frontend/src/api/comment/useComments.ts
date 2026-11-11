import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../axios";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Comment {
  id: number;
  task_id: number;
  project_id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: User;
  replies?: Comment[];
}

export interface CreateCommentData {
  content: string;
  parent_id?: number;
}

export interface UpdateCommentData {
  content: string;
}

// Hook to fetch comments for a task
export function useComments(taskId: number) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: async (): Promise<Comment[]> => {
      const response = await API.get(`/api/tasks/${taskId}/comments`);
      return response.data.data || response.data;
    },
    enabled: !!taskId,
  });
}

// Hook to create a new comment
export function useCreateComment(taskId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCommentData): Promise<Comment> => {
      const response = await API.post(`/api/tasks/${taskId}/comments`, data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch comments for this task
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });
}

// Hook to update a comment
export function useUpdateComment(taskId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ commentId, data }: { commentId: number; data: UpdateCommentData }): Promise<Comment> => {
      const response = await API.put(`/api/comments/${commentId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch comments for this task
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });
}

// Hook to delete a comment
export function useDeleteComment(taskId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentId: number): Promise<void> => {
      await API.delete(`/api/comments/${commentId}`);
    },
    onSuccess: () => {
      // Invalidate and refetch comments for this task
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });
}
