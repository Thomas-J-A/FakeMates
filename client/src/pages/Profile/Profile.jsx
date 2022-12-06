import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import PulseLoader from 'react-spinners/PulseLoader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceSadTear } from '@fortawesome/free-regular-svg-icons';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import ProfileHeader from './ProfileHeader/ProfileHeader';
import ProfileHeaderSkeleton from './ProfileHeader/ProfileHeader.skeleton';
import ProfileDescription from './ProfileDescription/ProfileDescription';
import ProfileDescriptionSkeleton from './ProfileDescription/ProfileDescription.skeleton';
import FriendsListPreviews from './FriendsListPreviews/FriendsListPreviews';
import FriendsListPreviewsSkeleton from './FriendsListPreviews/FriendsListPreviews.skeleton';
import Post from '../../components/Post/Post';
import PostSkeleton from '../../components/Post/Post.skeleton';
import StatusUpdateForm from '../../components/StatusUpdateForm/StatusUpdateForm';
import Backdrop from '../../components/Backdrop/Backdrop';
import ImageUploadModal from './ImageUploadModal/ImageUploadModal';
import EditInfoModal from './EditInfoModal/EditInfoModal';
import FriendsListModal from './FriendsListModal/FriendsListModal';
import ScrollToTop from '../../components/ScrollToTop/ScrollToTop';
import AdsCarousel from '../../components/AdsCarousel/AdsCarousel';
import {
  WendellsIceCream,
  McDougallsMatchmaking,
  PedrosHerbs,
} from '../../components/Ads/';

import './Profile.css';

// Custom styles for PulseLoader component
const cssOverride = {
  display: "block",
  margin: "var(--s-400) auto 0",
};

const ads = [
  <WendellsIceCream />,
  <McDougallsMatchmaking />,
  <PedrosHerbs />
];

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpenModal, setIsOpenModal] = useState({
    background: false,
    avatar: false,
    profileInfo: false,
    friendsList: false,
  });

  const observer = useRef(null);
  const location = useLocation();

  const { userId } = location.state;

  // Setup intersection observer which lets react know that
  // last post is nearly visible so fetch more posts
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
    
    if (isLoading || error) return;

    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(observerCallback, observerOptions);

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Fetch user data
        const resUserData = await fetch(`http://192.168.8.146:3000/api/users/${ userId }`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!resUserData.ok) {
          return setError('userData');
        }

        const bodyUserData = await resUserData.json();

        setUserData(bodyUserData);

        // Fetch first page of posts
        const resPosts = await fetch(`http://192.168.8.146:3000/api/posts?userid=${ userId }&page=1`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!resPosts.ok) {
          return setError('posts');
        }

        const bodyPosts = await resPosts.json();

        setPosts(bodyPosts.posts);
        setHasMore(bodyPosts.hasMore);
      } catch(err) {
        setError('other');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [userId]);

  // Fetch posts whenever user scrolls
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError('');

      try {
        const res = await fetch(`http://192.168.8.146:3000/api/posts?userid=${ userId }&page=${ currentPage }`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          return setError('posts');
        }

        const body = await res.json();

        setPosts((prevPosts) => [...prevPosts, ...body.posts]);
        setHasMore(body.hasMore);
      } catch (err) {
        setError('other');
      } finally {
        setIsLoading(false);
      }
    };

    // First page is fetched in earlier useEffect hook
    if (currentPage > 1) {
      fetchPosts();
    }
  }, [currentPage]);

  const closeModal = () => setIsOpenModal({
    background: false,
    avatar: false,
    profileInfo: false,
    friendsList: false,
  });

  const initialPage = currentPage === 1;

  return (
    <div className="profile">
      {error !== 'userData'
        ? (
          <>
            {initialPage && isLoading
              ? <ProfileHeaderSkeleton />
              : <ProfileHeader userData={userData} />
            }
            {initialPage && isLoading
              ? <ProfileDescriptionSkeleton />
              : <ProfileDescription userData={userData} setIsOpenModal={setIsOpenModal} />
            }
            <AdsCarousel ads={ads} type="profile" />
            {initialPage && isLoading
              ? <FriendsListPreviewsSkeleton />
              : <FriendsListPreviews userData={userData} setIsOpenModal={setIsOpenModal} />
            }
            <section className="posts">
              <StatusUpdateForm setPosts={setPosts} />
              {posts.map((post, index) => {
                return posts.length === index + 1
                  ? <Post key={post._id} ref={lastPostRef} post={post} setPosts={setPosts} />
                  : <Post key={post._id} post={post} setPosts={setPosts} />
              })}
              {initialPage && isLoading && (
                Array(5).fill().map((_, i) => {
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
              {posts.length > 0 && !hasMore && (
                <p className="posts__noMoreMessage">No more posts to display.</p>
              )}
              {!isLoading && !posts.length && (error !== 'posts') && (
                <div className="posts__noPosts">
                  <FontAwesomeIcon className="posts__noPostsIcon" icon={faFaceSadTear} />
                  <p className="posts__noPostsMessage">There are no posts to display.</p>
                </div>
              )}
              {error === 'posts' && (
                <div className="posts__error">
                  <FontAwesomeIcon className="posts__errorIcon" icon={faTriangleExclamation} />
                  <p
                    className="posts__errorMessage">
                    {initialPage ? "Failed to load posts." : "Failed to load more posts."}
                  </p>
                </div>
              )}
            </section>
            <ScrollToTop />
            {userData && (
              <>
                <Backdrop type="modal" isVisible={Object.values(isOpenModal).some((v) => v)} close={closeModal} />
                <ImageUploadModal
                  type="avatar"
                  isOpen={isOpenModal.avatar}
                  closeModal={closeModal}
                  imageUrl={userData.avatarUrl}
                  setUserData={setUserData}
                />
                <ImageUploadModal
                  type="background"
                  isOpen={isOpenModal.background}
                  closeModal={closeModal}
                  imageUrl={userData.backgroundUrl}
                  setUserData={setUserData}
                />
                <EditInfoModal
                  isOpen={isOpenModal.profileInfo}
                  closeModal={closeModal}
                  userData={userData}
                  setUserData={setUserData}
                />
                <FriendsListModal
                  isOpen={isOpenModal.friendsList}
                  closeModal={closeModal}
                  userData={userData}
                />
              </>
            )}  
          </>
        ) : (
          <div className="profile__error">
            <FontAwesomeIcon className="profile__errorIcon" icon={faTriangleExclamation} />
            <p className="profile__errorMessage">A little spot of bother fetching this info...</p>
          </div>
        )
      }
    </div>
  );
};

export default Profile;
