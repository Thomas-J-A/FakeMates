import Skeleton from 'react-loading-skeleton';

import 'react-loading-skeleton/dist/skeleton.css';
import './ProfileHeader.skeleton.css';

const ProfileHeaderSkeleton = () => {
  return (
    <div className="profileHeaderSkeleton">
      <Skeleton height={128} />
      <Skeleton containerClassName="profileHeaderSkeleton__avatar" height={128} width={128} circle />
    </div>
  );
};

export default ProfileHeaderSkeleton;
