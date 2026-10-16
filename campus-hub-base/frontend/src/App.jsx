import { useCallback, useEffect, useState } from 'react'
import { api, clearCredentials, setCredentials } from './api.js'

const emptyPost = { title: '', content: '', categoryId: '' }

function formatDate(value) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function App() {
  const [user, setUser] = useState(null)
  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [filters, setFilters] = useState({ keyword: '', categoryId: '' })
  const [tab, setTab] = useState('all') // 'all' | 'saved'
  const [dialog, setDialog] = useState(null)
  const [notice, setNotice] = useState('')

  const loadPosts = useCallback(async () => {
    try {
      if (tab === 'saved') {
        const page = await api('/posts/saved')
        setPosts(page.content)
      } else {
        const query = new URLSearchParams()
        if (filters.keyword) query.set('keyword', filters.keyword)
        if (filters.categoryId) query.set('categoryId', filters.categoryId)
        const page = await api(`/posts?${query}`)
        setPosts(page.content)
      }
    } catch (error) {
      setNotice(error.message)
    }
  }, [filters, tab])

  useEffect(() => {
    api('/categories').then(setCategories).catch((error) => setNotice(error.message))
    api('/auth/me').then(setUser).catch(() => clearCredentials())
  }, [])

  useEffect(() => {
    let active = true
    const fetchPosts = async () => {
      try {
        if (tab === 'saved') {
          const page = await api('/posts/saved')
          if (active) setPosts(page.content)
        } else {
          const query = new URLSearchParams()
          if (filters.keyword) query.set('keyword', filters.keyword)
          if (filters.categoryId) query.set('categoryId', filters.categoryId)
          const page = await api(`/posts?${query}`)
          if (active) setPosts(page.content)
        }
      } catch (error) {
        if (active) setNotice(error.message)
      }
    }
    fetchPosts()
    return () => { active = false }
  }, [filters, tab])

  async function openPost(id) {
    try {
      setSelectedPost(await api(`/posts/${id}`))
    } catch (error) {
      setNotice(error.message)
    }
  }

  function logout() {
    clearCredentials()
    setUser(null)
    setSelectedPost(null)
    setTab('all')
    setNotice('Đã đăng xuất')
  }

  async function refreshSelected() {
    if (selectedPost) await openPost(selectedPost.id)
    await loadPosts()
  }

  async function handleToggleBookmark(postId) {
    if (!user) {
      setNotice('Vui lòng đăng nhập để lưu bài viết')
      setDialog('login')
      return
    }
    try {
      const res = await api(`/posts/${postId}/bookmark`, { method: 'POST' })
      setNotice(res.bookmarked ? 'Đã lưu bài viết vào mục yêu thích' : 'Đã bỏ lưu bài viết')
      await loadPosts()
      if (selectedPost && selectedPost.id === postId) {
        await openPost(postId)
      }
    } catch (error) {
      setNotice(error.message)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => { setSelectedPost(null); setTab('all') }}>
          <span className="brand-mark">C</span>
          <span>Campus Hub</span>
        </button>
        <nav>
          {user ? (
            <>
              <span className="user-name">Xin chào, {user.displayName}</span>
              <button className="button ghost" onClick={() => setDialog('post')}>Đăng bài</button>
              <button className="button secondary" onClick={logout}>Đăng xuất</button>
            </>
          ) : (
            <button className="button primary" onClick={() => setDialog('login')}>Đăng nhập</button>
          )}
        </nav>
      </header>

      <main>
        {notice && <div className="notice" onClick={() => setNotice('')}>{notice}</div>}
        {selectedPost ? (
          <PostDetail post={selectedPost} user={user} onBack={() => setSelectedPost(null)}
            onChanged={refreshSelected} onDeleted={() => { setSelectedPost(null); loadPosts() }}
            onBookmark={() => handleToggleBookmark(selectedPost.id)}
            setNotice={setNotice} />
        ) : (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">Không gian chung của sinh viên</p>
                <h1>Chia sẻ điều đang diễn ra trong trường.</h1>
                <p>Tìm sự kiện, hỏi đáp, trao đổi đồ dùng và cùng giải quyết những vấn đề gần gũi.</p>
              </div>
              <div className="hero-stat"><strong>{posts.length}</strong><span>bài đăng đang hiển thị</span></div>
            </section>

            {user && (
              <div className="tab-nav">
                <button
                  className={`tab-button ${tab === 'all' ? 'active' : ''}`}
                  onClick={() => setTab('all')}
                >
                  Tất cả bài đăng
                </button>
                <button
                  className={`tab-button ${tab === 'saved' ? 'active' : ''}`}
                  onClick={() => setTab('saved')}
                >
                  🔖 Bài viết đã lưu
                </button>
              </div>
            )}

            {tab === 'all' && (
              <section className="filters" aria-label="Tìm kiếm bài đăng">
                <input value={filters.keyword} placeholder="Tìm theo tiêu đề hoặc nội dung..."
                  onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} />
                <select value={filters.categoryId}
                  onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}>
                  <option value="">Tất cả chuyên mục</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </section>
            )}

            <section className="post-grid">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={user}
                  onOpen={openPost}
                  onBookmark={() => handleToggleBookmark(post.id)}
                />
              ))}
              {!posts.length && (
                <div className="empty">
                  {tab === 'saved'
                    ? 'Bạn chưa lưu bài viết nào. Hãy bấm "Lưu" ở các bài đăng bạn quan tâm.'
                    : 'Chưa có bài đăng phù hợp.'}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer>Campus Hub · Dự án nền cho Mini Project Session 13</footer>

      {dialog === 'login' && <AuthDialog onClose={() => setDialog(null)} onLogin={(loggedInUser) => {
        setUser(loggedInUser); setDialog(null); setNotice('Đăng nhập thành công'); loadPosts()
      }} />}
      {dialog === 'post' && <PostDialog categories={categories} onClose={() => setDialog(null)}
        onSaved={() => { setDialog(null); setNotice('Đã đăng bài'); loadPosts() }} />}
    </div>
  )
}

function PostCard({ post, user, onOpen, onBookmark }) {
  return (
    <article className="post-card" onClick={() => onOpen(post.id)}>
      <div className="card-top">
        <span className="tag">{post.category.name}</span>
        <span>{formatDate(post.createdAt)}</span>
      </div>
      <h2>{post.title}</h2>
      <p>{post.content}</p>
      <div className="card-footer">
        <span>{post.author.displayName}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>♥ {post.reactionCount} · {post.commentCount} bình luận</span>
          {user && (
            <button
              className={`bookmark-btn ${post.bookmarkedByCurrentUser ? 'active' : ''}`}
              title={post.bookmarkedByCurrentUser ? 'Bỏ lưu' : 'Lưu bài'}
              onClick={(e) => {
                e.stopPropagation()
                onBookmark()
              }}
            >
              🔖 {post.bookmarkedByCurrentUser ? 'Đã lưu' : 'Lưu'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function PostDetail({ post, user, onBack, onChanged, onDeleted, onBookmark, setNotice }) {
  const [comment, setComment] = useState('')
  const canManage = user && (user.id === post.author.id || user.role === 'ADMIN')

  async function act(action, success) {
    try {
      await action()
      setNotice(success)
      await onChanged()
    } catch (error) {
      setNotice(error.message)
    }
  }

  return (
    <section className="detail">
      <button className="back" onClick={onBack}>← Quay lại danh sách</button>
      <div className="detail-card">
        <div className="card-top"><span className="tag">{post.category.name}</span><span>{formatDate(post.createdAt)}</span></div>
        <h1>{post.title}</h1>
        <p className="author">Đăng bởi {post.author.displayName} · Trạng thái: {post.status}</p>
        <div className="content">{post.content}</div>
        <div className="actions">
          <button className={`button ${post.reactedByCurrentUser ? 'primary' : 'secondary'}`} disabled={!user}
            onClick={() => act(() => api(`/posts/${post.id}/reaction`, { method: 'POST' }), 'Đã cập nhật quan tâm')}>
            ♥ {post.reactionCount} quan tâm
          </button>
          <button className={`button ${post.bookmarkedByCurrentUser ? 'primary' : 'secondary'}`} disabled={!user}
            onClick={onBookmark}>
            🔖 {post.bookmarkedByCurrentUser ? 'Đã lưu' : 'Lưu bài'} ({post.bookmarkCount || 0})
          </button>
          {canManage && post.status !== 'RESOLVED' && <button className="button secondary"
            onClick={() => act(() => api(`/posts/${post.id}/status`, {
              method: 'PATCH', body: JSON.stringify({ status: 'RESOLVED' }),
            }), 'Đã đánh dấu hoàn tất')}>Đánh dấu hoàn tất</button>}
          {user?.role === 'ADMIN' && post.status !== 'HIDDEN' && <button className="button secondary"
            onClick={() => act(() => api(`/posts/${post.id}/status`, {
              method: 'PATCH', body: JSON.stringify({ status: 'HIDDEN' }),
            }), 'Đã ẩn bài đăng')}>Ẩn bài</button>}
          {canManage && <button className="button danger" onClick={async () => {
            if (!window.confirm('Xóa bài đăng này?')) return
            try {
              await api(`/posts/${post.id}`, { method: 'DELETE' })
              setNotice('Đã xóa bài đăng')
              onDeleted()
            } catch (error) {
              setNotice(error.message)
            }
          }}>Xóa bài</button>}
        </div>
      </div>

      <div className="comments">
        <h2>Bình luận ({post.commentCount})</h2>
        {user ? <form onSubmit={(event) => {
          event.preventDefault()
          act(() => api(`/posts/${post.id}/comments`, { method: 'POST', body: JSON.stringify({ content: comment }) }),
            'Đã thêm bình luận').then(() => setComment(''))
        }}>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)}
            placeholder="Viết bình luận..." required maxLength="1000" />
          <button className="button primary">Gửi bình luận</button>
        </form> : <p className="muted">Đăng nhập để bình luận hoặc bày tỏ quan tâm.</p>}
        <div className="comment-list">
          {post.comments.map((item) => <div className="comment" key={item.id}>
            <strong>{item.author.displayName}</strong><span>{formatDate(item.createdAt)}</span><p>{item.content}</p>
          </div>)}
        </div>
      </div>
    </section>
  )
}

function AuthDialog({ onClose, onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', displayName: '', password: '' })
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      if (mode === 'register') {
        await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
      setCredentials(form.username, form.password)
      const user = await api('/auth/me')
      onLogin(user)
    } catch (err) {
      clearCredentials()
      setError(err.message)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-top">
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <button className="icon-button" onClick={onClose}>×</button>
        </div>
        <form className="form" onSubmit={submit}>
          {error && <p className="form-error">{error}</p>}
          <label>
            <span>Tên đăng nhập</span>
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })}
              required minLength="3" maxLength="60" />
          </label>
          {mode === 'register' && (
            <label>
              <span>Tên hiển thị</span>
              <input value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                required minLength="2" maxLength="100" />
            </label>
          )}
          <label>
            <span>Mật khẩu</span>
            <input type="password" value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required minLength="6" maxLength="100" />
          </label>
          <button className="button primary">{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
          <div className="dialog-switch">
            {mode === 'login' ? (
              <p>Chưa có tài khoản? <button type="button" className="text-button"
                onClick={() => { setMode('register'); setError('') }}>Đăng ký ngay</button></p>
            ) : (
              <p>Đã có tài khoản? <button type="button" className="text-button"
                onClick={() => { setMode('login'); setError('') }}>Đăng nhập</button></p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function PostDialog({ categories, onClose, onSaved }) {
  const [form, setForm] = useState(emptyPost)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api('/posts', {
        method: 'POST',
        body: JSON.stringify({ ...form, categoryId: Number(form.categoryId) }),
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-top">
          <h2>Tạo bài đăng mới</h2>
          <button className="icon-button" onClick={onClose}>×</button>
        </div>
        <form className="form" onSubmit={submit}>
          {error && <p className="form-error">{error}</p>}
          <label>
            <span>Chuyên mục</span>
            <select value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>
              <option value="">Chọn một chuyên mục</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label>
            <span>Tiêu đề</span>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Tóm tắt ngắn gọn điều bạn muốn chia sẻ" required maxLength="160" />
          </label>
          <label>
            <span>Nội dung</span>
            <textarea value={form.content} rows="6"
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              placeholder="Mô tả chi tiết nội dung cần thông báo, hỏi hoặc trao đổi..." required
              maxLength="10000" />
          </label>
          <button className="button primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Đăng bài'}</button>
        </form>
      </div>
    </div>
  )
}

export default App
