import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';

import './AddFriendButton.css';

const AddFriendButton = ({ context, name }) => {
  const addFriend = () => {
    console.log('submitting friend request...');
  };

  return (
    <button
      className={`addFriendButton addFriendButton--${ context }`}
      type="button"
      onClick={addFriend}
    >
      <FontAwesomeIcon className="addFriendButton__icon" icon={faUserPlus} />
      {`Add ${ name }`}
    </button>
  );
};

export default AddFriendButton;
