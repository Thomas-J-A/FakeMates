import { Link } from "react-router-dom";

import "./FriendsListPreviews.css";

const FriendsListPreview = ({ friend }) => {
  return (
    <Link to={`/profile/${friend._id}`}>
      <img
        className="friendsListPreview"
        src={`http://${process.env.HOST}:3000/${friend.avatarUrl}`}
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
          FakeMates{" "}
          <span className="friendsListPreviews__friendsCount">{`(${userData.friends.length})`}</span>
        </h1>
        <span
          className={`friendsListPreviews__viewAll ${
            userData.friends.length
              ? ""
              : "friendsListPreviews--noFriends__viewAll"
          }`}
          onClick={
            userData.friends.length
              ? () => setIsOpenModal((prev) => ({ ...prev, friendsList: true }))
              : undefined
          }
        >
          View All
        </span>
      </header>
      {userData.friends.length ? (
        <div className="friendsListPreviews__preview">
          {/* Only preview first 9 friends (fewer on mobile, hidden with CSS) */}
          {userData.friends
            .filter((el, i) => i < 9)
            .map((friend) => (
              <FriendsListPreview key={friend._id} friend={friend} />
            ))}
        </div>
      ) : (
        <p className="friendsListPreviews__noFriendsMsg">No friends, lol.</p>
      )}
    </div>
  );
};

export default FriendsListPreviews;
