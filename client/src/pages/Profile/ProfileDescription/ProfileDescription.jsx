import { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faImage, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import Options from '../../../components/Options/Options';

import './ProfileDescription.css';

const ProfileDescription = ({ userData, setIsOpenModal }) => {
  const [isVisibleProfileOptions, setIsVisibleProfileOptions] = useState(false);

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

  return (
    <div className="profileDescription">
      <p className="profileDescription__bio">{userData.bio ? userData.bio : 'I\'m far too lazy to bother writing anything about myself.'}</p>
      <p className="profileDescription__location">
        Lives in <span className="profileDescription__locationEmphasis">{userData.location ? userData.location : 'an undisclosed location'}</span>
      </p>
      <p className="profileDescription__hometown">
        From <span className="profileDescription__hometownEmphasis">{userData.hometown ? userData.hometown : 'God only knows'}</span>
      </p>
      <p className="profileDescription__occupation">
        Works as a/an <span className="profileDescription__occupationEmphasis">{userData.occupation ? userData.occupation : 'fireman, perhaps?'}</span>
      </p>
      <FontAwesomeIcon
        className="profileDescription__options"
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
  );
};

export default ProfileDescription;
