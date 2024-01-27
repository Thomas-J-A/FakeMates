import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";

import "./AddFriendButton.css";

const AddFriendButton = ({ context, userData, setUserData }) => {
  // Send a friend request to profile owner
  const addFriend = async () => {
    try {
      const res = await fetch(
        `http://${process.env.HOST}:3000/api/friend-requests?to=${userData._id}`,
        {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error();

      // Update state in profile component with updated relationship status value in order to update UI
      setUserData({ ...userData, relationshipStatus: "pending" });
    } catch (err) {
      console.log("An error occurred.");
    }
  };

  return (
    <button
      className={`addFriendButton addFriendButton--${context}`}
      type="button"
      onClick={addFriend}
    >
      <FontAwesomeIcon className="addFriendButton__icon" icon={faUserPlus} />
      {`Add ${userData.firstName}`}
    </button>
  );
};

export default AddFriendButton;
