import { useEffect, useRef } from 'react';

import FriendRequests from './FriendRequests/FriendRequests';
import UserActivities from './UserActivities/UserActivities';

import './Notifications.css';

const Notifications = ({ isOpen }) => {
  const friendRequestsRef = useRef(null);
  const userActivitiesRef = useRef(null);

  // Scroll friend request/notification list back to top when closing drawer
  useEffect(() => {
    const scrollToTop = () => {
      friendRequestsRef.current.scrollTop = 0;
      userActivitiesRef.current.scrollTop = 0;
    };

    if (!isOpen) {
      setTimeout(scrollToTop, 300);
    }
  }, [isOpen]);

  return (
    <div className="notifications">
      <FriendRequests ref={friendRequestsRef} />
      <UserActivities ref={userActivitiesRef} isOpen={isOpen} />
    </div>
  );
};

export default Notifications;
