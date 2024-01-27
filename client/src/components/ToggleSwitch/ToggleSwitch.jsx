import { useState } from "react";

import "./ToggleSwitch.css";

const ToggleSwitch = ({ isChecked, id }) => {
  const [isToggleChecked, setIsToggleChecked] = useState(isChecked);

  // Update user's isPrivate setting in database record and current UI
  const handleToggle = async () => {
    try {
      const res = await fetch(
        `http://${process.env.HOST}:3000/api/users/${id}?action=change-visibility`,
        {
          method: "PUT",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error();

      setIsToggleChecked((prevValue) => !prevValue);
    } catch (err) {
      console.log("An error occurred.");
    }
  };

  return (
    <label className="toggleSwitch">
      <input
        className="toggleSwitch__checkbox"
        type="checkbox"
        checked={isToggleChecked}
        onChange={handleToggle}
      />
      <div className="toggleSwitch__slider" />
      <p className="toggleSwitch__text">
        Account:
        <span className="toggleSwitch__accountStatus">
          {isToggleChecked ? " private" : " public"}
        </span>
      </p>
    </label>
  );
};

export default ToggleSwitch;
