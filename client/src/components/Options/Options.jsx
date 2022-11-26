import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './Options.css';

const Options = ({ isVisible, setIsVisible, linksData, type }) => {
  const timeoutRef = useRef(null);

  // Close profile options menu automatically if not closed by user
  useEffect(() => {
    isVisible
      ? timeoutRef.current = setTimeout(() => setIsVisible(false), 5000)
      : timeoutRef.current && clearTimeout(timeoutRef.current);
  }, [isVisible]);

  return (
    <div className={`options ${ isVisible ? "options--visible" : "" } options--${ type }`}>
      <ul className="optionsList">
        {linksData.map((linkData) => (
          <li className="optionsList__item" onClick={linkData.onClick}>
            <FontAwesomeIcon className="optionsList__icon" icon={linkData.icon} fixedWidth />
            <p className="optionsList__text">{linkData.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Options;
