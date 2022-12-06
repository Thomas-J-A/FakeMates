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
      <div className="friendsListPreviewsSkeleton__previews">
        <Skeleton containerClassName="friendsListPreviewsSkeleton__preview" height={64} />
        <Skeleton containerClassName="friendsListPreviewsSkeleton__preview" height={64} />
        <Skeleton containerClassName="friendsListPreviewsSkeleton__preview" height={64} />
        <Skeleton containerClassName="friendsListPreviewsSkeleton__preview" height={64} />
      </div>
    </div>
  );
};

export default FriendsListPreviewsSkeleton;
