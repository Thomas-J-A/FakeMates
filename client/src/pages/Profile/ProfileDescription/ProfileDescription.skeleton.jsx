import Skeleton from 'react-loading-skeleton';

import 'react-loading-skeleton/dist/skeleton.css';
import './ProfileDescription.skeleton.css';

const ProfileDescriptionSkeleton = () => {
  return (
    <div className="profileDescriptionSkeleton">
      <Skeleton containerClassName="profileDescriptionSkeleton__bio" height={32} />
      <Skeleton containerClassName="profileDescriptionSkeleton__info" count={3} />
      <Skeleton containerClassName="profileDescriptionSkeleton__relationshipMsg" />
    </div>
  );
};

export default ProfileDescriptionSkeleton;
