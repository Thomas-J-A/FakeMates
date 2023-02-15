import Skeleton from "react-loading-skeleton";

import 'react-loading-skeleton/dist/skeleton.css';
import './Notification.skeleton.css';

const NotificationSkeleton = ({ context }) => {
  const options = (
    <>
      {context === 'friendRequest' && (
        <Skeleton containerClassName="notificationSkeleton__decline" circle height={26} width={26} />
      )}
      <Skeleton circle height={26} width={26} />
    </>
  )

  return (
    <div className="notificationSkeleton">
      <Skeleton containerClassName="notificationSkeleton__avatar" circle height={32} width={32} />
      <div className="notificationSkeleton__info">
        <Skeleton count={1.5} />
      </div>
      <div className="notificationSkeleton__options">
        {options}
      </div>
    </div>
  );
};

export default NotificationSkeleton;
