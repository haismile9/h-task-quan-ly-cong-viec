import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  useComments, 
  useCreateComment, 
  useUpdateComment, 
  useDeleteComment,
  type Comment 
} from '../api/comment/useComments';
import { 
  AiOutlineSend, 
  AiOutlineEdit, 
  AiOutlineDelete, 
  AiOutlineComment,
  AiOutlineLoading3Quarters
} from 'react-icons/ai';

interface CommentSectionProps {
  taskId: number;
}

interface CommentItemProps {
  comment: Comment;
  taskId: number;
  currentUserId: number;
  onReply?: (parentId: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  taskId, 
  currentUserId, 
  onReply 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);

  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const handleUpdate = async () => {
    if (editContent.trim()) {
      try {
        await updateComment.mutateAsync({
          commentId: comment.id,
          data: { content: editContent.trim() }
        });
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating comment:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
      try {
        await deleteComment.mutateAsync(comment.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEdit = comment.user_id === currentUserId;

  return (
    <div className="bg-base-100 border border-base-300 rounded-lg p-4 mb-3">
      {/* Comment Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-8 h-8">
              <span className="text-sm">{comment.user.name.charAt(0)}</span>
            </div>
          </div>
          <div>
            <p className="font-medium text-sm">{comment.user.name}</p>
            <p className="text-xs text-base-content/60">{formatDate(comment.created_at)}</p>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex space-x-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-ghost btn-xs"
              disabled={updateComment.isPending}
            >
              <AiOutlineEdit size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-ghost btn-xs text-error"
              disabled={deleteComment.isPending}
            >
              {deleteComment.isPending ? (
                <AiOutlineLoading3Quarters size={14} className="animate-spin" />
              ) : (
                <AiOutlineDelete size={14} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Comment Content */}
      {isEditing ? (
        <div className="mb-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="textarea textarea-bordered w-full resize-none"
            rows={3}
            placeholder="Viết bình luận..."
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              className="btn btn-sm btn-ghost"
              disabled={updateComment.isPending}
            >
              Hủy
            </button>
            <button
              onClick={handleUpdate}
              className="btn btn-sm btn-primary"
              disabled={updateComment.isPending || !editContent.trim()}
            >
              {updateComment.isPending ? (
                <AiOutlineLoading3Quarters className="animate-spin" />
              ) : (
                'Cập nhật'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
      )}

      {/* Comment Actions */}
      <div className="flex items-center justify-between text-xs">
        <button
          onClick={() => onReply?.(comment.id)}
          className="btn btn-ghost btn-xs"
        >
          <AiOutlineComment size={14} />
          Trả lời
        </button>
        
        {comment.replies && comment.replies.length > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="btn btn-ghost btn-xs"
          >
            {showReplies ? 'Ẩn' : 'Hiện'} {comment.replies.length} phản hồi
          </button>
        )}
      </div>

      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              taskId={taskId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({ taskId }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: comments, isLoading, error } = useComments(taskId);
  const createComment = useCreateComment(taskId);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({
        content: newComment.trim()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyingTo) return;

    try {
      await createComment.mutateAsync({
        content: replyContent.trim(),
        parent_id: replyingTo
      });
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const handleReply = (parentId: number) => {
    setReplyingTo(parentId);
  };

  if (isLoading) {
    return (
      <div className="bg-base-100 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <AiOutlineLoading3Quarters className="animate-spin mr-2" />
          <span>Đang tải bình luận...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-base-100 rounded-lg p-6">
        <div className="text-center text-error">
          <p>Không thể tải bình luận</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        Bình luận ({comments?.length || 0})
      </h3>

      {/* New Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex items-start space-x-3">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-8 h-8">
              <span className="text-sm">{user?.name?.charAt(0)}</span>
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="textarea textarea-bordered w-full resize-none"
              rows={3}
              placeholder="Viết bình luận..."
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={createComment.isPending || !newComment.trim()}
              >
                {createComment.isPending ? (
                  <AiOutlineLoading3Quarters className="animate-spin" />
                ) : (
                  <>
                    <AiOutlineSend size={16} />
                    Gửi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Reply Form */}
      {replyingTo && (
        <div className="mb-6 ml-11 bg-base-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Trả lời bình luận</span>
            <button 
              onClick={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
              className="btn btn-ghost btn-xs"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmitReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="textarea textarea-bordered w-full resize-none mb-2"
              rows={2}
              placeholder="Viết phản hồi..."
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={createComment.isPending || !replyContent.trim()}
              >
                {createComment.isPending ? (
                  <AiOutlineLoading3Quarters className="animate-spin" />
                ) : (
                  'Trả lời'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              taskId={taskId}
              currentUserId={user?.id || 0}
              onReply={handleReply}
            />
          ))
        ) : (
          <div className="text-center text-base-content/60 py-8">
            <p>Chưa có bình luận nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
