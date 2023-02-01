import FriendRequests from './FriendRequests/FriendRequests';
import UserActivities from './UserActivities/UserActivities';

import './Notifications.css';

const Notifications = () => {
  return (
    <div className="notifications">
      <FriendRequests />
      <UserActivities />
    </div>
  );
};

export default Notifications;


  

// useEffect(() => {
//   const fetchFriendRequests = async () => {
//     try {
//       const res = await fetch('http://192.168.8.146:3000/api/friend-requests', {
//         method: 'GET',
//         mode: 'cors',
//         credentials: 'include',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       const body = await res.json();

//       setFriendRequests(body);
//     } catch (err) {
//       console.log('Something went wrong...');
//     }
//   };

//   fetchFriendRequests();
// }, []);
