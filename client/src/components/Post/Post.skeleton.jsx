import Skeleton from 'react-loading-skeleton';

import 'react-loading-skeleton/dist/skeleton.css';
import './Post.skeleton.css';

const PostSkeleton = () => {
  return (
    <div className="postSkeleton">
      <div className="postSkeletonHeader">
        <Skeleton circle height={32} width={32} />
        <div className="postSkeletonMeta">
          <Skeleton width="50%" />
          <Skeleton width="30%" />
        </div>
      </div>
      <div className="postSkeletonContent">
        <Skeleton count={2} />
      </div>
      <div className="postSkeletonFooter">
        <Skeleton width={64} />
        <Skeleton containerClassName="postSkeleton__expandComments" />
      </div>
    </div>
  );
};

export default PostSkeleton;
