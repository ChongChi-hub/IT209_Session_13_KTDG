package vn.edu.ptit.campushub.bookmark;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.edu.ptit.campushub.post.Post;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    Optional<Bookmark> findByPostIdAndUserId(Long postId, Long userId);

    long countByPostId(Long postId);

    @Modifying
    void deleteByPostId(Long postId);

    @Query("SELECT b.post FROM Bookmark b WHERE b.user.id = :userId AND b.post.status <> 'HIDDEN' ORDER BY b.createdAt DESC")
    Page<Post> findBookmarkedPostsByUserId(@Param("userId") Long userId, Pageable pageable);
}
