import Skeleton from 'react-loading-skeleton';

import 'react-loading-skeleton/dist/skeleton.css';
import './ProfileDescription.skeleton.css';

const ProfileDescriptionSkeleton = () => {
  return (
    <div className="profileDescriptionSkeleton">
      <Skeleton className="profileDescriptionSkeleton__name" height={32} />
      <Skeleton count={3} />
    </div>
  );
};

export default ProfileDescriptionSkeleton;
