import { useState, useEffect } from 'react';

import './ToggleSwitch.css';

const ToggleSwitch = () => {
  // TODO: Get isPrivate value from authState.currentUser and initialize isChecked with that value
  const [isChecked, setIsChecked] = useState(true);

  const handleToggle = () => {
    // TODO: Call API to change isPrivate values
    console.log('Changing account status...');
    setIsChecked((prevValue) => !prevValue);
  };

  return (
    <label className="toggleSwitch">
      <input
        className="toggleSwitch__checkbox"
        type="checkbox"
        checked={isChecked}
        onChange={handleToggle}
      />
      <div className="toggleSwitch__slider" />
      <p className="toggleSwitch__text">Account:
        <span className="toggleSwitch__accountStatus">{isChecked ? " private" : " public"}</span>
      </p>
    </label>
  );
};

export default ToggleSwitch;
