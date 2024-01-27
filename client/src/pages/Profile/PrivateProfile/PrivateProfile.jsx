import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserLock,
  faUserPlus,
  faUserClock,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";

import AddFriendButton from "../AddFriendButton/AddFriendButton";

import "./PrivateProfile.css";

const PrivateProfile = ({ userData, setUserData }) => {
  // Render appropriate icon and message/button which represents relationship between the two users
  let icon;
  let messageOrButton;

  // There are no cases for 'accepted' and 'oneself' because in
  // such cases the user wouldn't be shown this private screen
  switch (userData.relationshipStatus) {
    case "none":
      icon = faUserPlus;
      messageOrButton = (
        <AddFriendButton
          context="privateProfile"
          userData={userData}
          setUserData={setUserData}
        />
      );
      break;
    case "pending":
      icon = faUserClock;
      messageOrButton = (
        <p className="privateProfile__relationshipMsg">
          FakeMate request pending.
        </p>
      );
      break;
    case "rejected":
      icon = faUserSlash;
      messageOrButton = (
        <p className="privateProfile__relationshipMsg">
          FakeMate request declined.
        </p>
      );
      break;
  }

  return (
    <div className="privateProfile">
      <div className="privateProfile__header">
        <p className="privateProfile__name">
          {userData.fullName}
          <FontAwesomeIcon
            className="privateProfile__relationshipStatusIcon"
            icon={icon}
          />
        </p>
        <img
          className="privateProfile__avatar"
          src={`http://${process.env.HOST}:3000/${userData.avatarUrl}`}
          crossOrigin="anonymous"
          alt=""
        />
        <img
          className="privateProfile__backgroundImage"
          src={`http://${process.env.HOST}:3000/${userData.backgroundUrl}`}
          alt=""
          crossOrigin="anonymous"
        />
      </div>
      <div className="privateProfile__main">
        <FontAwesomeIcon
          className="privateProfile__lockIcon"
          icon={faUserLock}
        />
        <p className="privateProfile__message">This account is private.</p>
        {messageOrButton}
        <div className="privateProfile__banner">No Peeking!</div>
      </div>
    </div>
  );
};

export default PrivateProfile;
