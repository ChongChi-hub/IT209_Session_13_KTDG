CREATE TABLE bookmarks (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT uk_bookmark_post_user UNIQUE (post_id, user_id),
    CONSTRAINT fk_bookmarks_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
