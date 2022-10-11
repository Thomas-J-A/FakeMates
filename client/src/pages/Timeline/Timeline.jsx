import { useState, useEffect, useRef, useCallback } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faFaceSadTear } from '@fortawesome/free-regular-svg-icons';

import StatusUpdateForm from '../../components/Post/StatusUpdateForm';
import Post from '../../components/Post/Post';
import PostSkeleton from '../../components/Post/PostSkeleton';
import ScrollToTop from '../../components/ScrollToTop/ScrollToTop';

import './Timeline.css';

const cssOverride = {
  display: "block",
  margin: "var(--s-400) auto 0",
};

const Timeline = () => {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const observer = useRef(null);

  const lastPostRef = useCallback((node) => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px 40% 0px',
      threshold: 0.5,
    };
  
    const observerCallback = (entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setCurrentPage((prevPage) => prevPage + 1);
      }
    };

    if (isLoading || error) return; // NOTE 1

    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(observerCallback, observerOptions);

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);
  
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`http://192.168.8.146:3000/api/timeline?page=${ currentPage }`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const body = await res.json();

        setPosts((prevPosts) => [...prevPosts, ...body.posts]);
        setHasMore(body.hasMore);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage]);

  const initialPage = currentPage === 1;

  return (
    <div className="timeline">
      <section className="posts">
        <StatusUpdateForm setPosts={setPosts} />
        {posts.map((post, index) => {
          return posts.length === index + 1
            ? <Post key={post._id} ref={lastPostRef} post={post} setPosts={setPosts} />
            : <Post key={post._id} post={post} setPosts={setPosts} />
        })}
        {initialPage && isLoading && (
          Array(10).fill().map((_, i) => {
            return <PostSkeleton key={i} />
          })
        )}
        {!initialPage && (
          <PulseLoader
          loading={isLoading}
          size={16}
          speedMultiplier={.8}
          color="#fff"
          cssOverride={cssOverride}
          />
        )}
        {!initialPage && !hasMore && (
          <p className="posts__noMoreMessage">No more posts to display.</p>
        )}
        {!isLoading && !posts.length && !error && (          // TODO: check conditional is correct
          <div className="posts__noPosts">
            <FontAwesomeIcon className="posts__noPostsIcon" icon={faFaceSadTear} />
            <p className="posts__noPostsMessage">There are no posts to display.</p>
          </div>
        )}
        {error && (
          <div className="posts__error">
            <FontAwesomeIcon className="posts__errorIcon" icon={faTriangleExclamation} />
            <p
              className="posts__errorMessage">
              {initialPage ? "Failed to load posts." : "Failed to load more posts."}
            </p>
          </div>
        )}
      </section>
      <aside className="">
        <div className="">
          AD GOES HERE
        </div>
        <div className="">
          ONLINE FRIENDS
        </div>
        <div className="">
          ANOTHER AD
        </div>
      </aside>
      <ScrollToTop />
    </div>
  );
};

export default Timeline;

// NOTE 1
// Because observer cb runs once when initially passing an element there will be an
// infinite loop because the last post element will be intersecting until the API call returns
// and gives the ref to an offscreen element; check isLoading value to avoid infinite re-rendering
