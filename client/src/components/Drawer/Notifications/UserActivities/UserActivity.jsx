import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import UserActivityMessage from "./UserActivityMessage";

import useFetch from "../../../../hooks/useFetch";

import "./UserActivity.css";
import { useEffect } from "react";

const fetchOpts = {
  method: "PUT",
  mode: "cors",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};

const UserActivity = ({ ua, setUserActivities }) => {
  /************ STATE  ************/

  const [{ data, isLoading }, doFetch] = useFetch(
    `http://${process.env.HOST}:3000/api/notifications/${ua._id}?action=delete`,
    { isLoadingOnMount: false }
  );

  /************ HOOKS  ************/

  // Remove notification in frontend
  useLayoutEffect(() => {
    if (data) {
      setUserActivities((prevValues) =>
        prevValues.filter((prevValue) => prevValue._id !== ua._id)
      );
    }
  }, [data]);

  /************ FUNCTIONS  ************/

  // Remove notification in backend
  const removeNotification = async () => {
    try {
      doFetch(fetchOpts);
    } catch (err) {
      console.log(err);
    }
  };

  /************ JSX  ************/

  return (
    <div className="userActivity">
      <Link to={`/profile/${ua.actor._id}`}>
        <img
          className="userActivity__avatar"
          src={`http://${process.env.HOST}:3000/${ua.actor.avatarUrl}`}
          crossOrigin="anonymous"
          alt="Avatar of user who performed activity"
        />
      </Link>
      <div className="userActivity__info">
        <UserActivityMessage ua={ua} />
        <p className="userActivity__time">
          {formatDistance(new Date(ua.createdAt), new Date(), {
            addSuffix: true,
          })}
        </p>
      </div>
      <div className="userActivity__options">
        <button
          className="userActivity__button userActivity__remove"
          type="button"
          onClick={removeNotification}
          disabled={isLoading}
        >
          <FontAwesomeIcon className="userActivity__icon" icon={faXmark} />
        </button>
      </div>
    </div>
  );
};

export default UserActivity;
