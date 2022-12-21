import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUserXmark } from '@fortawesome/free-solid-svg-icons';
import { faMessage } from '@fortawesome/free-regular-svg-icons';

import './FriendsListModal.css';

const Friend = ({ friend, isOwn, currentUser }) => {
  // Create two arrays containing friend IDs to compare
  const ownFriendsIdArr = currentUser.friends.map((f) => f._id);
  const theirFriendsIdArr = friend.friends;

  // Calculate number of mutual friends
  let mutualFriendsCount;

  if (friend._id === currentUser._id) {
    // Don't count mutual friends if that friend is current user themself
    mutualFriendsCount = 'N/A'
  } else if (ownFriendsIdArr.includes(friend._id)) {
    // Current user and this person are already friends
    mutualFriendsCount = 'FakeMates'
  } else {
    // Count mutual friends
    mutualFriendsCount = ownFriendsIdArr.reduce((count, ownFriend) => {
      return count + (theirFriendsIdArr.includes(ownFriend) ? 1 : 0)
    }, 0)
  }

  return (
    <div className="friend">
      <Link to={`/profile/${ friend._id }`}>
        <img
          className="friend__avatar"
          src={`http://192.168.8.146:3000/${ friend.avatarUrl }`}
          crossOrigin="anonymous"
          alt=""
        />
      </Link>
      <div className="friend__info">
        <Link to={`/profile/${ friend._id }`}>
          <p className="friend__name">{friend.fullName}</p>
        </Link>
        {isOwn
          ? (
            <div className="friend__buttons">
              <button
                className="friend__button friend__unfriend"
                type="button"
                onClick={() => console.log('unfriending this person...')}
                >
                <FontAwesomeIcon className="friend__buttonIcon" icon={faUserXmark} />
                DITCH
              </button>
              <button
                className="friend__button friend__message"
                type="button"
                onClick={() => console.log('messaging this person...')}
                >
                <FontAwesomeIcon className="friend__buttonIcon" icon={faMessage} />
                MESSAGE
              </button>
            </div>
          ) : (
            <p className="friend__mutualFriendsCount">
              { typeof mutualFriendsCount === 'number'
                  ? `${ mutualFriendsCount } ${ mutualFriendsCount === 1 ? 'mutual FakeMate' : 'mutual FakeMates' }`
                  : mutualFriendsCount
              }
            </p>
          )
        }
      </div>
    </div>
  );
};

const FriendsListModal = ({ isOpen, closeModal, userData, isOwn, currentUser }) => {
  const friendsListRef = useRef(null);

  // Scroll friends list back to top when closing modal
  useEffect(() => {
    const scrollToTop = () => {
      friendsListRef.current.scrollTop = 0;
    };

    if (!isOpen) {
      setTimeout(scrollToTop, 300);
    }
  }, [isOpen]);

  return (
    <div className={`friendsListModal ${ isOpen ? "friendsListModal--open" : "" } ${ isOwn ? "friendsListModal--own" : "" }`} ref={friendsListRef}>
      <header className="friendsListModal__header">
        <h1 className="friendsListModal__title">
          FakeMates <span className="friendsListModal__friendsCount">{`(${  userData.friends.length })`}</span>
        </h1>
        <FontAwesomeIcon
          className="friendsListModal__exit"
          icon={faXmark}
          onClick={closeModal}
        />
      </header>
      <div className="friendsListModal__friends">
        {userData.friends.map((friend) => (
          <Friend
            key={friend._id}
            friend={friend}
            isOwn={isOwn}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
};

export default FriendsListModal;
