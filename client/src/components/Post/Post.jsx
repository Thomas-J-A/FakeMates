import { useState, useEffect, useCallback, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import PulseLoader from 'react-spinners/PulseLoader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faComment } from '@fortawesome/free-regular-svg-icons';
import { faEllipsisVertical, faTriangleExclamation, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { formatDistance } from 'date-fns';

import Comment from '../Comment/Comment';
import CommentForm from './CommentForm';
import PostOptions from './PostOptions';

import { useAuth } from '../../contexts/AuthContext';

import usePrevious from '../../hooks/usePrevious';

import './Post.css';

const cssOverride = {
  display: "block",
  margin: "0 auto",
};

const Post = forwardRef(({ post, setPosts }, ref) => {
  const [comments, setComments] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [resultsRemaining, setResultsRemaining] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areExpandedComments, setAreExpandedComments] = useState(false);
  const [isVisiblePostOptions, setIsVisiblePostOptions] = useState(false);

  const { authState: { currentUser } } = useAuth();

  const prevAreExpandedComments = usePrevious(areExpandedComments);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://192.168.8.146:3000/api/comments?postid=${ post._id }&page=${ currentPage }`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const body = await res.json();

      setComments((prevComments) => {
        // If an incomplete page of results is returned then current page number will be
        // used again in next API request so this logic filters out duplicate comments
        const currentCommentIds = prevComments.map((c) => c._id);
        const commentsNotDisplayed = body.comments.filter(({ _id }) => !currentCommentIds.includes(_id));

        return [...prevComments, ...commentsNotDisplayed];
      });

      setHasMore(body.hasMore);
      setResultsRemaining(body.resultsRemaining);

      // Only update currentPage if all (5) results have been fetched from current page
      if (body.comments.length === 5) {
        setCurrentPage((prevValue) => prevValue + 1);
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [post, currentPage]);

  useEffect(() => {
    // Only execute hook when areExpandedComments dependency changes
    if (areExpandedComments === prevAreExpandedComments) return;

    // The !hasMore conditional ensures that more comments are only fetched when
    // there are currently none being displayed, or when all comments have been
    // loaded and it's just checking for any new ones; loading more comments every
    // time the comments section is expanded would make the user feel out of control
    if (areExpandedComments && !hasMore) {
      fetchComments();
    }
  }, [areExpandedComments, hasMore]); 

  const loadMoreComments = () => {
    fetchComments();
  };

  const likePost = async () => {
    const id = post._id;

    try {
      const res = await fetch(`http://192.168.8.146:3000/api/posts/${ id }`, {
        method: 'PUT',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const updatedPost = await res.json();

      setPosts((prevPosts) => (
        prevPosts.map((p) => p._id === updatedPost._id ? updatedPost : p)
      ));
    } catch (err) {
      console.log(err);
    }
  };

  const toggleComments = () => {
    if (areExpandedComments) {
      // Prevent brief render of error message when expanding commments (if error object exists)
      setError(null);

      return setAreExpandedComments(false);
    }

    // Prevent brief render of form element that occurs in render function
    // before useEffect hook changes isLoading value to true
    if (!hasMore) {
      setIsLoading(true);
    }

    setAreExpandedComments(true);
  };

  const submitComment = async (values, { resetForm, setStatus }) => {
    // Clear any global errors stored in status
    setStatus('');

    try {
      const res = await fetch(`http://192.168.8.146:3000/api/comments?postid=${ post._id }`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: values.content,
        }),
      });

      if (!res.ok) throw new Error(res);

      const newComment = await res.json();

      // Increase comments count on post footer
      setPosts((prevPosts) => (
        prevPosts.map((p) => p._id === newComment.postId ? { ...p, commentsCount: p.commentsCount += 1 } : p)
      ));

      // Add new comment to comments array
      setComments((prevComments) => [...prevComments, newComment]);

      // Clear textarea
      resetForm();
    } catch (err) {
      // Clear textarea and let client know about server error
      resetForm();
      setStatus('Oops, something went wrong with the internets');
    }
  };

  const isOwn = post.postedBy._id === currentUser._id;

  return (
    <article className="post" ref={ref ? ref : null} > {/* Only last post is forwarded a ref */}
      <header className="postHeader">
        <Link to={`/profile/${ post.postedBy._id }`}>
          <img
            className="postHeader__avatar"
            src={`http://192.168.8.146:3000/${ post.postedBy.avatarUrl }`}
            crossOrigin="anonymous"
            alt=""
          />
        </Link>
        <div className="postHeader__meta">
          <Link to={`/profile/${ post.postedBy._id }`}>
            <p className="postHeader__postedBy">{post.postedBy.fullName}</p>
          </Link>
          <p className="postHeader__createdAt">{formatDistance(new Date(post.createdAt), new Date(), { addSuffix: true })}</p>
        </div>
        <FontAwesomeIcon
          className="postHeader__options"
          icon={faEllipsisVertical}
          onClick={() => setIsVisiblePostOptions((prev) => !prev)}
        />
        <PostOptions
          isOwn={isOwn}
          isVisible={isVisiblePostOptions}
          setIsVisible={setIsVisiblePostOptions}
          postId={post._id}
          setPosts={setPosts}
        />
      </header>
      <main className="postContent">
        <p className="postContent__text">{post.content}</p>
        {post.imageUrl && (
          <img
            className="postContent__image"
            src={`http://192.168.8.146:3000/${ post.imageUrl }`}
            crossOrigin="anonymous"
            alt=""
          />
        )}
      </main>
      <footer className="postFooter">
        <div
          className={`postFooter__likesCount ${ isOwn ? 'postFooter--own__likesCount' : '' } ${ post.likedBy.includes(currentUser._id) ? 'postFooter__likesCount--liked' : '' }`}
          onClick={!isOwn ? likePost : undefined}
        >
          <FontAwesomeIcon className="postFooter__likesIcon" icon={faThumbsUp} />
          <span className="postFooter__likesTotal">{post.likedBy.length}</span>
        </div>
        <div className="postFooter__commentsCount">
          <FontAwesomeIcon className="postFooter__commentsIcon" icon={faComment} />
          <span className="postFooter__commentsTotal">{post.commentsCount}</span>
        </div>
        <div
          className={`postFooter__expandComments  ${ areExpandedComments ? 'postFooter__expandComments--expanded' : '' }`}
          onClick={toggleComments}
        >
          {/* <FontAwesomeIcon className="postFooter__expandIcon" icon={faAngleDown} /> */}
          <span className="postFooter__viewComments">View comments</span>
        </div>
      </footer>
      {areExpandedComments && (
        <section className="postComments">
          <div className="postComments__comments">
            {comments.map((comment) => <Comment key={comment._id} comment={comment} setComments={setComments} />)}
            {!isLoading && hasMore && !error && (
              <p className="postComments__loadMore" onClick={loadMoreComments}>
                {resultsRemaining > 1 ? `Load ${resultsRemaining} more comments...` : 'Load 1 more comment...'}
              </p>
            )}
          </div>
          <PulseLoader
            loading={isLoading}
            size={8}
            speedMultiplier={.8}
            color="#000"
            cssOverride={cssOverride}
          />
          {error
            ? (
              <div className="postComments__error">
                <FontAwesomeIcon className="postComments__errorIcon" icon={faTriangleExclamation} />
                <p
                  className="postComments__errorMessage">
                  {comments.length ? "Failed to load more comments." : "Failed to load comments."}
                </p>
              </div>
            ) : (
              <>
                {!isLoading && !comments.length && <p className="postComments__firstComment">Be the first to comment!</p>}
                {!isLoading && !hasMore && <CommentForm handleSubmit={submitComment} />}
              </>
            )
          }
        </section>
      )}
    </article>
  );
});

export default Post;
