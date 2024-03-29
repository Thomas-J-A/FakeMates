import Skeleton from 'react-loading-skeleton';

import 'react-loading-skeleton/dist/skeleton.css';
import './ProfileHeader.skeleton.css';

const ProfileHeaderSkeleton = () => {
  return (
    <div className="profileHeaderSkeleton">
      <Skeleton className="profileHeaderSkeleton__background" height={132} />
      <Skeleton
        containerClassName="profileHeaderSkeleton__avatarWrapper"
        className="profileHeaderSkeleton__avatar"
        height={120}
        width={128}
        circle
      />
    </div>
  );
};

export default ProfileHeaderSkeleton;
