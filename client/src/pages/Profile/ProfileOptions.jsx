import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faImage, faPenToSquare } from '@fortawesome/free-regular-svg-icons';

import './ProfileOptions.css';

const ProfileOptions = ({ isVisible, setIsVisible, setIsOpenModal }) => {
  const timeoutRef = useRef(null);

  // Close profile options menu automatically if not closed by user
  useEffect(() => {
    isVisible
      ? timeoutRef.current = setTimeout(() => setIsVisible(false), 5000)
      : timeoutRef.current && clearTimeout(timeoutRef.current);
  }, [isVisible]);

  return (
    <div className={`profileOptions ${ isVisible ? "profileOptions--visible" : "" }`}>
      <ul className="profileOptionsList">
        <li className="profileOptionsList__item" onClick={() => setIsOpenModal((prev) => ({ ...prev, avatar: true }))}>
          <FontAwesomeIcon className="profileOptionsList__icon" icon={faUser} fixedWidth />
          <p className="profileOptionsList__text">Edit Avatar</p>
        </li>
        <li className="profileOptionsList__item" onClick={() => setIsOpenModal((prev) => ({ ...prev, background: true }))}>
          <FontAwesomeIcon className="profileOptionsList__icon" icon={faImage} fixedWidth />
          <p className="profileOptionsList__text">Edit Background</p>
        </li>
        <li className="profileOptionsList__item" onClick={() => setIsOpenModal((prev) => ({  ...prev, profileInfo: true }))}>
          <FontAwesomeIcon className="profileOptionsList__icon" icon={faPenToSquare} fixedWidth />
          <p className="profileOptionsList__text">Edit Details</p>
        </li>
      </ul>
    </div>
  );
};

export default ProfileOptions;
