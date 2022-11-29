import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faUser } from '@fortawesome/free-solid-svg-icons';
import { faImage, faPenToSquare } from '@fortawesome/free-regular-svg-icons';

import Options from '../../components/Options/Options';
import Backdrop from '../../components/Backdrop/Backdrop';
import ImageUploadModal from './ImageUploadModal';
import EditInfoModal from './EditInfoModal';
import FriendsListModal from './FriendsListModal';
import FriendsListPreviews from './FriendsListPreviews';
import Post from '../../components/Post/Post';
import StatusUpdateForm from '../../components/StatusUpdateForm/StatusUpdateForm';
import AdsCarousel from '../../components/AdsCarousel/AdsCarousel';
import {
  WendellsIceCream,
  McDougallsMatchmaking,
  PedrosHerbs,
} from '../../components/Ads/';

import './Profile.css';

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
  const [error, setError] = useState(null);
  const [isVisibleProfileOptions, setIsVisibleProfileOptions] = useState(false);
  const [isOpenModal, setIsOpenModal] = useState({
    background: false,
    avatar: false,
    profileInfo: false,
    friendsList: false,
  });

  const observer = useRef(null);
  const location = useLocation();

  const { userId } = location.state;

  // Fetch profile data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`http://192.168.8.146:3000/api/users/${ userId }`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const body = await res.json();
        
        setUserData(body);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

  // Fetch posts on initial render and whenever user scrolls
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`http://192.168.8.146:3000/api/posts?userid=${ userId }&page=${ currentPage }`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const body = await res.json();

        setPosts((prevPosts) => [...prevPosts, body.posts]);
        setHasMore(body.hasMore);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage]);

  const closeModal = () => setIsOpenModal({
    background: false,
    avatar: false,
    profileInfo: false,
    friendsList: false,
  });

  // Passed as argument to reusable Options component
  const linksData = [
    {
      onClick: () => setIsOpenModal((prev) => ({ ...prev, avatar: true })),
      icon: faUser,
      text: 'Edit Avatar',
    },
    {
      onClick: () => setIsOpenModal((prev) => ({ ...prev, background: true })),
      icon: faImage,
      text: 'Edit Background',
    },
    {
      onClick: () => setIsOpenModal((prev) => ({  ...prev, profileInfo: true })),
      icon: faPenToSquare,
      text: 'Edit Details',
    },
  ];

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="profile">
      <div className="profile__header">
        <p className="profile__name">{userData.fullName}</p>
        <img
          className="profile__avatar"
          src={`http://192.168.8.146:3000/${ userData.avatarUrl }`}
          crossOrigin="anonymous"
          alt=""
        />
        <img
          className="profile__backgroundImage"
          src={`http://192.168.8.146:3000/${ userData.backgroundUrl }`}
          alt=""
          crossOrigin="anonymous"
        />
      </div>
      <div className="profile__description">
        <p className="profile__bio">{userData.bio ? userData.bio : 'I\'m far too lazy to bother writing anything about myself.'}</p>
        <p className="profile__location">
          Lives in <span className="profile__locationEmphasis">{userData.location ? userData.location : 'an undisclosed location'}</span>
        </p>
        <p className="profile__hometown">
          From <span className="profile__hometownEmphasis">{userData.hometown ? userData.hometown : 'God only knows'}</span>
        </p>
        <p className="profile__occupation">
          Works as a/an <span className="profile__occupationEmphasis">{userData.occupation ? userData.occupation : 'fireman, perhaps?'}</span>
        </p>
        <FontAwesomeIcon
          className="profile__options"
          icon={faPenToSquare}
          onClick={() => setIsVisibleProfileOptions((prev) => !prev)}
        />
        <Options
          isVisible={isVisibleProfileOptions}
          setIsVisible={setIsVisibleProfileOptions}
          linksData={linksData}
          type="profile"
        />
      </div>
      <AdsCarousel ads={ads} type="profile" />
      <FriendsListPreviews userData={userData} setIsOpenModal={setIsOpenModal} />
      <section className="posts">
        <StatusUpdateForm setPosts={setPosts} />
        {/* {posts.map((post, index) => {
          return post.length === index + 1
            ? <Post key={post._id} ref={lastPostRef} post={post} setPosts={setPosts} />
            : <Post key={post._id} post={post} setPosts={setPosts} />
        })} */}
      </section>
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
    </div>
  );
};

export default Profile;
