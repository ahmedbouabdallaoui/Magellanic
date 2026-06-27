import { useState, useEffect } from 'react';
import { comments as cApi } from '../api/client';

export default function CommentSection({ constellationId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [constellationId]);

  const loadComments = async () => {
    try {
      const data = await cApi.list(constellationId);
      setComments(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const data = await cApi.create(constellationId, text);
      setComments([data, ...comments]);
      setText('');
    } catch {
    }
  };

  const handleDelete = async (id) => {
    try {
      await cApi.delete(id);
      setComments(comments.filter(c => c.id !== id));
    } catch {
    }
  };

  if (loading) return <div className="loader" />;

  return (
    <div className="comment-section">
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          placeholder="Share your thoughts..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <button type="submit" disabled={!text.trim()}>Post</button>
      </form>
      <div className="comment-list">
        {comments.map((c) => (
          <div key={c.id} className="comment">
            <div className="comment-header">
              <span className="comment-author">{c.username}</span>
              <span className="comment-date">{new Date(c.created_at).toLocaleDateString()}</span>
              <button className="comment-delete" onClick={() => handleDelete(c.id)}>×</button>
            </div>
            <p className="comment-text">{c.text}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="comment-empty">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
