import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUserXmark } from '@fortawesome/free-solid-svg-icons';
import { faMessage } from '@fortawesome/free-regular-svg-icons';

import './FriendsListModal.css';

const Friend = ({ friend }) => {
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
        <div className="friend__buttons">
          <button
            className="friend__button friend__message"
            type="button"
            onClick={() => console.log('messaging this person...')}
            >
            <FontAwesomeIcon className="friend__buttonIcon" icon={faMessage} />
            MESSAGE
          </button>
          <button
            className="friend__button friend__unfriend"
            type="button"
            onClick={() => console.log('unfriending this person...')}
            >
            <FontAwesomeIcon className="friend__buttonIcon" icon={faUserXmark} />
            DITCH
          </button>
        </div>
      </div>
    </div>
  );
};

const FriendsListModal = ({ isOpen, closeModal, userData }) => {
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
    <div className={`friendsListModal ${ isOpen ? "friendsListModal--open" : "" }`} ref={friendsListRef}>
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
        {userData.friends.map((friend) => <Friend friend={friend} />)}
      </div>
    </div>
  );
};

export default FriendsListModal;
