import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faXmark,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import PulseLoader from "react-spinners/PulseLoader";

import useFetch from "../../../../hooks/useFetch";

import "./FriendRequest.css";

const cssOverride = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// currentUser must be renamed because call to setAuthInfo function API also requires a value of that name
const FriendRequest = ({
  fr,
  authState: { currentUser: currentUserData, expiresAt },
  setAuthInfo,
}) => {
  const [{ data, isLoading, error }, doFetch] = useFetch(
    `http://${process.env.HOST}:3000/api/friend-requests/${fr._id}`
  );

  const isAccepted = useMemo(() => data && data.statusCode === 200, [data]);

  // Accept or decline friend request
  const handleFriendRequest = async (accept) => {
    const fetchOpts = {
      method: "PUT",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const query = new URLSearchParams({ accept });

    doFetch(fetchOpts, query);
  };

  // If accepted, add new friend's ID to authState context so users become friends
  // immediately, during current session; currentUser is only updated on login.
  useEffect(() => {
    if (isAccepted) {
      const updatedFriendsList = [
        ...currentUserData.friends,
        {
          _id: fr.from._id,
          fullName: fr.from.fullName,
          avatarUrl: fr.from.avatarUrl,
        },
      ];

      const currentUser = { ...currentUserData, friends: updatedFriendsList };

      setAuthInfo({ currentUser, expiresAt });

      // ---- FOR BACKEND? ----
      // TODO: if requester is online, use websockets to update their friends list so they can become
      // friends during their current session too (emit an updateFriendsList message to requester)
      // TODO: emit a request accepted/rejected notification, and store that notification object in db
    }
  }, [isAccepted]);

  if (isLoading) {
    return (
      <PulseLoader
        size={10}
        speedMultiplier={0.8}
        color="#fff"
        cssOverride={cssOverride}
      />
    );
  }

  if (error) {
    return (
      <div className="friendRequest__error">
        <FontAwesomeIcon
          className="friendRequest__errorIcon"
          icon={faTriangleExclamation}
        />
        <p className="friendRequest__errorMsg">
          This wasn't supposed to happen...
        </p>
      </div>
    );
  }

  // Once user handles request, display a message instead of request in UI
  // This will be displayed until a page refresh/logout
  if (data) {
    return (
      <p className="friendRequest__statusMsg">
        {`You have ${isAccepted ? "accepted" : "declined"} ${
          fr.from.firstName
        }'s FakeMate request.`}
      </p>
    );
  }

  // Display a friend request in UI
  return (
    <div className="friendRequest">
      <Link to={`/profile/${fr.from._id}`}>
        <img
          className="friendRequest__avatar"
          src={`http://${process.env.HOST}:3000/${fr.from.avatarUrl}`}
          crossOrigin="anonymous"
          alt="Avatar of user who sent friend request"
        />
      </Link>
      <div className="friendRequest__info">
        <Link to={`/profile/${fr.from._id}`}>
          <p className="friendRequest__name">{fr.from.fullName}</p>
        </Link>
        <p className="friendRequest__time">
          {formatDistance(new Date(fr.createdAt), new Date(), {
            addSuffix: true,
          })}
        </p>
      </div>
      <div className="friendRequest__options">
        <button
          className="friendRequest__button friendRequest__decline"
          type="button"
          onClick={() => handleFriendRequest(false)}
        >
          <FontAwesomeIcon className="friendRequest__icon" icon={faXmark} />
        </button>
        <button
          className="friendRequest__button friendRequest__accept"
          type="button"
          onClick={() => handleFriendRequest(true)}
        >
          <FontAwesomeIcon className="friendRequest__icon" icon={faCheck} />
        </button>
      </div>
    </div>
  );
};

export default FriendRequest;
