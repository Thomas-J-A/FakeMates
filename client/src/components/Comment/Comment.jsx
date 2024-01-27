import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { formatDistance } from "date-fns";

import { useAuth } from "../../contexts/AuthContext";

import "./Comment.css";

const Comment = ({ comment, setComments }) => {
  const {
    authState: { currentUser },
  } = useAuth();

  const likeComment = async () => {
    try {
      const res = await fetch(
        `http://${process.env.HOST}:3000/api/comments/${comment._id}`,
        {
          method: "PUT",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const updatedComment = await res.json();

      setComments((prevComments) =>
        prevComments.map((c) =>
          c._id === updatedComment._id ? updatedComment : c
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  const isOwn = comment.postedBy._id === currentUser._id;

  return (
    <article className="comment">
      <div className="comment__left">
        <Link to={`/profile/${comment.postedBy._id}`}>
          <img
            className="comment__avatar"
            src={`http://${process.env.HOST}:3000/${comment.postedBy.avatarUrl}`}
            crossOrigin="anonymous"
            alt=""
          />
        </Link>
      </div>
      <div className="comment__right">
        <header className="commentHeader">
          <Link to={`/profile/${comment.postedBy._id}`}>
            <p className="commentHeader__postedBy">
              {comment.postedBy.fullName}
            </p>
          </Link>
          <p className="commentHeader__createdAt">
            {formatDistance(new Date(comment.createdAt), new Date(), {
              addSuffix: true,
            })}
          </p>
        </header>
        <p className="comment__text">{comment.content}</p>
        <div
          className={`comment__likes ${isOwn ? "comment--own__likes" : ""} ${
            comment.likedBy.includes(currentUser._id)
              ? "comment__likes--liked"
              : ""
          }`}
          onClick={!isOwn ? likeComment : undefined}
        >
          <FontAwesomeIcon className="comment__likesIcon" icon={faThumbsUp} />
          <span className="comment__likesTotal">{comment.likedBy.length}</span>
        </div>
      </div>
    </article>
  );
};

export default Comment;
