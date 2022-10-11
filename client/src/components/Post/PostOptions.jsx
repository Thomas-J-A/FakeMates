import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

import './PostOptions.css';

const PostOptions = ({ isOwn, isVisible, setIsVisible, postId, setPosts }) => {
  const timeoutRef = useRef(null);

  const showMysteryAlert = () => {
    alert('This is the mystery. Are you disappointed?');
  };

  const removePost = async () => {
    try {
      const res = await fetch(`http://192.168.8.146:3000/api/posts/${ postId }`, {
        method: 'DELETE',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(res);

      // Remove post from array of posts currently being shown in timeline
      setPosts((prevPosts) => prevPosts.filter((p) => p._id !== postId));
    } catch (err) {
      console.log(err);
    }
  };

  // Close post options menu automatically if not closed by user
  useEffect(() => {
    isVisible
      ? timeoutRef.current = setTimeout(() => setIsVisible(false), 5000)
      : timeoutRef.current && clearTimeout(timeoutRef.current);
  }, [isVisible]);

  return (
    <div className={`postOptions ${ isVisible ? "postOptions--visible" : "" }`}>
      <ul className="postOptionsList">
        {isOwn && (
          <li className="postOptionsList__item" onClick={removePost}>
          <FontAwesomeIcon className="postOptionsList__icon" icon={faTrashCan} fixedWidth />
          <p className="postOptionsList__text">Remove Post</p>
        </li>
        )}
        <li className="postOptionsList__item" onClick={showMysteryAlert}>
          <FontAwesomeIcon className="postOptionsList__icon" icon={faCircleQuestion} fixedWidth />
          <p className="postOptionsList__text">Mystery Click</p>
        </li>
      </ul>
    </div>
  );
};

export default PostOptions;
