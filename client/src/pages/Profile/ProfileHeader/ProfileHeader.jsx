import './ProfileHeader.css';

const ProfileHeader = ({ userData }) => {
  return (
    <div className="profileHeader">
      <p className="profileHeader__name">{userData.fullName}</p>
      <img
        className="profileHeader__avatar"
        src={`http://192.168.8.146:3000/${ userData.avatarUrl }`}
        crossOrigin="anonymous"
        alt=""
        />
      <img
        className="profileHeader__backgroundImage"
        src={`http://192.168.8.146:3000/${ userData.backgroundUrl }`}
        alt=""
        crossOrigin="anonymous"
        />
    </div>
  );
};

export default ProfileHeader;
