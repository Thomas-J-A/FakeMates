import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useContext,
  forwardRef
} from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import PulseLoader from 'react-spinners/PulseLoader';

import UserActivity from './UserActivity';
import NotificationSkeleton from '../Notification.skeleton';

import useFetch from '../../../../hooks/useFetch';

import { NotificationCountContext } from '../../../../contexts/NotificationCountContext';
import { useAuth } from '../../../../contexts/AuthContext';

import './UserActivities.css';

const cssOverride = {
  display: "flex",
  alignItems: 'center',
  justifyContent: 'center',
};

const UserActivities = forwardRef(({ isOpen }, ref) => {

  /************ STATE  ************/

  const [userActivities, setUserActivities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsRemaining, setResultsRemaining] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [{ data, isLoading, error }, doFetch] = useFetch(
    'http://192.168.8.146:3000/api/notifications',
    { isLoadingOnMount: true }
  );

  const [, doFetchRead] = useFetch(
    'http://192.168.8.146:3000/api/notifications',
    { isLoadingOnMount: false }
  );

  const { setNotificationCount } = useContext(NotificationCountContext);
  const { authState: { currentUser } } = useAuth();

  /************ HOOKS  ************/

  // Set initial notificationCount context; can't be done on mount because there
  // are various renders before data is retrieved and unreadCount can be read
  useEffect(() => {
    if (currentPage === 1 && data) {
      setNotificationCount(data.body.unreadCount);
    }
  }, [currentPage, data]);

  // Fetch new data every time currentPage value changes
  useEffect(() => {
    const fetchOpts = {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const query = new URLSearchParams({ page: currentPage });

    doFetch(fetchOpts, query);
  }, [currentPage, doFetch]);

  // Mark all fetched notifications as read
  useEffect(() => {
    const markAsRead = async () => {  
      try {
        const fetchOpts = {
          method: 'PUT',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        
        // Find only unread notifications in the array
        const unreadUserActivities = userActivities.filter((ua) => !ua.readBy.includes(currentUser._id));

        // If user simply opens drawer without loading more notifications, return
        if (!unreadUserActivities.length) return;

        // Mark each unread notification as read in backend
        const promises = unreadUserActivities.map(async (ua) => {
          const query = new URLSearchParams({ action: 'read' });
          const pathname = `api/notifications/${ ua._id }`;

          return await doFetchRead(fetchOpts, query, pathname);
        });
        
        await Promise.all(promises);

        // Update readBy array in each unread (now read) notification in local state
        // (already updated in backend from previous lines)
        const updatedUserActivities = userActivities.map((ua) => {
          if (!ua.readBy.includes(currentUser._id)) {
            ua.readBy.push(currentUser._id);
          }
          
          return ua; 
        });

        setUserActivities(updatedUserActivities);
        
        // Update notificationCount context to display new unread count in header
        setNotificationCount((prev) => prev - unreadUserActivities.length);
      } catch (err) {
        console.log(err);
      }
    };
      
    if (isOpen && userActivities.length) {
      markAsRead();
    }
  }, [isOpen, userActivities, data]);

  // Append latest data to local state to keep a list of all loaded data,
  useLayoutEffect(() => {
    if (data) {
      setUserActivities((prev) => [ ...prev, ...data.body.notifications ]);
      setResultsRemaining(data.body.resultsRemaining);
      setHasMore(data.body.hasMore);
    }
  }, [data]);

  /************ FUNCTIONS  ************/

  // Increase currentPage value so that on next render
  // the useEffect hook calling doFetch will execute
  const loadNextPage = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  /************ JSX LOGIC  ************/

  const userActivitiesList = useMemo(() => (
    userActivities.map((ua) => (
      <UserActivity key={ua._id} ua={ua} setUserActivities={setUserActivities} />
    ))
  ), [userActivities]);

  const loadMore = useMemo(() => (
    <p className="userActivities__loadMore" onClick={loadNextPage}>
      {resultsRemaining > 1 ? `Load ${ resultsRemaining } more notifications...` : 'Load 1 more notification...'}
    </p>
  ), [resultsRemaining]);

  const skeletonList = useMemo(() => (
    <div className="userActivities__skeletons">
      {Array(5).fill().map((_, i) => <NotificationSkeleton key={i} context="userActivity" />)}
    </div>
  ), [NotificationSkeleton]);

  const initialPage = currentPage === 1;

  /************ JSX  ************/

  return (
    <div className="userActivities" ref={ref}>
      <h1 className="userActivities__title">Notifications</h1>
      <div className="userActivities__list">
        {userActivitiesList}
        {hasMore && !isLoading && !error && loadMore}
      </div>

      {initialPage && isLoading && skeletonList}

      {!initialPage && (
        <PulseLoader
          loading={isLoading}
          size={10}
          speedMultiplier={.8}
          color="#fff"
          cssOverride={cssOverride}
        />
      )}

      {userActivities.length > 0 && !hasMore && (
        <p className="userActivities__noMoreMsg">No more notifications to display.</p>
      )}

      {!isLoading && !error && (!userActivities.length) && (
        <p className="userActivities__noUserActivitiesMsg">Your friends are boring.</p>
      )}

      {error && (
        <div className="userActivities__error">
          <FontAwesomeIcon className="userActivities__errorIcon" icon={faTriangleExclamation} />
          <p className="userActivities__errorMsg">Whoops-a-daisy!</p>
      </div>
      )}
    </div>
  );
});

export default UserActivities;
