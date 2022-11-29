import { Link } from 'react-router-dom';

import './FriendsListPreviews.css';

const FriendsListPreview = ({ friend }) => {
  return (
    <Link to={`/profile/${ friend._id }`}>
      <img
        className="friendsListPreview"
        src={`http://192.168.8.146:3000/${ friend.avatarUrl }`}
        crossOrigin="anonymous"
        alt=""
      />
    </Link>
 );
};

const FriendsListPreviews = ({ userData, setIsOpenModal }) => {
  return (
    <div className="friendsListPreviews">
      <header className="friendsListPreviews__header">
        <h1 className="friendsListPreviews__title">
          FakeMates <span className="friendsListPreviews__friendsCount">{`(${ userData.friends.length })`}</span>
        </h1>
        <span
          className={`friendsListPreviews__viewAll ${ userData.friends.length ? '' : 'friendsListPreviews--noFriends__viewAll' }`}
          onClick={userData.friends.length ? () => setIsOpenModal((prev) => ({ ...prev, friendsList: true })) : undefined} 
        >
          View All
        </span>
      </header>
      {userData.friends.length
        ? (
          <div className="friendsListPreviews__preview">
            {/* Only preview first 8 friends */}
            {userData.friends
              .filter((el, i) => i < 8)
              .map((friend) => <FriendsListPreview key={friend._id} friend={friend} />)
            }
          </div>
        ) : <p className="friendsListPreviews__noFriendsMsg">You have no friends, lol.</p>
      }
    </div>
  );
};

export default FriendsListPreviews;
