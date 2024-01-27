import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserGear,
  faUserPlus,
  faUserClock,
  faUserCheck,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";

import "./ProfileHeader.css";

const ProfileHeader = ({ userData }) => {
  // Render appropriate icon which represents relationship between the two users
  let icon;

  switch (userData.relationshipStatus) {
    case "none":
      icon = faUserPlus;
      break;
    case "pending":
      icon = faUserClock;
      break;
    case "accepted":
      icon = faUserCheck;
      break;
    case "rejected":
      icon = faUserSlash;
      break;
    default:
      icon = faUserGear;
  }

  return (
    <div className="profileHeader">
      <p className="profileHeader__name">
        {userData.fullName}
        <FontAwesomeIcon
          className="profileHeader__relationshipStatusIcon"
          icon={icon}
        />
      </p>
      <img
        className="profileHeader__avatar"
        src={`http://${process.env.HOST}:3000/${userData.avatarUrl}`}
        crossOrigin="anonymous"
        alt=""
      />
      <img
        className="profileHeader__backgroundImage"
        src={`http://${process.env.HOST}:3000/${userData.backgroundUrl}`}
        alt=""
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default ProfileHeader;
