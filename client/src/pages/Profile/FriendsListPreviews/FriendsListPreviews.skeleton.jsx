import Skeleton from 'react-loading-skeleton';

import 'react-loading-skeleton/dist/skeleton.css';
import './FriendsListPreviews.skeleton.css';

const FriendsListPreviewsSkeleton = () => {
  return (
    <div className="friendsListPreviewsSkeleton">
      <div className="friendsListPreviewsSkeleton__header">
        <Skeleton containerClassName="friendsListPreviewsSkeleton__title" />
        <Skeleton containerClassName="friendsListPreviewsSkeleton__viewAll" />
      </div>
      <Skeleton containerClassName="friendsListPreviewsSkeleton__preview" count={9} inline={true} height={64} />
    </div>
  );
};

export default FriendsListPreviewsSkeleton;
