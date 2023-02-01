import Skeleton from "react-loading-skeleton";

import 'react-loading-skeleton/dist/skeleton.css';
import './FriendRequest.skeleton.css';

const FriendRequestSkeleton = () => {
  return (
    <div className="friendRequestSkeleton">
      <Skeleton containerClassName="friendRequestSkeleton__avatar" circle height={32} width={32} />
      <div className="friendRequestSkeleton__info">
        <Skeleton count={1.5} />
      </div>
      <div className="friendRequestSkeleton__options">
        <Skeleton containerClassName="friendRequestSkeleton__decline" circle height={26} width={26} />
        <Skeleton circle height={26} width={26} />
      </div>
    </div>
  );
};

export default FriendRequestSkeleton;
