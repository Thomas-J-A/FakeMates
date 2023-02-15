import { Link } from 'react-router-dom';

import './UserActivityMessage.css';

const UserActivityMessage = ({ ua }) => {
  const actorLink = (
    <Link to={`/profile/${ ua.actor._id }`} className="userActivityMessage__name">
      {ua.actor.fullName}
    </Link>
  );

  let action;
  let sourceLink;

  switch (ua.actionType) {
    case 1:
      action = 'created a';
      sourceLink = (
        <Link
          to={`/posts/${ ua.actionSources.post }`}
          className="userActivityMessage__source"
        >
          new post
        </Link>
      );

      break;
    case 2:
      action = 'liked your';
      sourceLink = (
        <Link
          to={`/posts/${ ua.actionSources.post }`}
          className="userActivityMessage__source"
        >
          post
        </Link>
      );

      break;
    case 3:
      action = 'commented on your';
      sourceLink = (
        <Link
          to={`/posts/${ ua.actionSources.post }`}
          state={{ commentId: ua.actionSources.comment }}
          className="userActivityMessage__source"
        >
          post
        </Link>
      );

      break;
    case 4:
      action = 'liked your';
      sourceLink = (
        <Link
          to={`/posts/${ ua.actionSources.post }`}
          state={{ commentId: ua.actionSources.comment }}
          className="userActivityMessage__source"
        >
          comment
        </Link>
      );

      break;
    case 5:
      action = 'updated their';
      sourceLink = (
        <Link
          to={`/profile/${ ua.actor._id }`}
          className="userActivityMessage__source"
        >
          profile
        </Link>
      );

      break;
    default:
      action = 'did';
      sourceLink = 'something';
  }

  return (
    <p className="userActivityMessage">
      {actorLink} { action } { sourceLink }
    </p>
  );
};

export default UserActivityMessage;


// Thomas created a new post.
// Thomas liked your post.
// Thomas commented on your post.
// Thomas liked your comment.
// Thomas updated their profile
