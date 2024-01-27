import { useEffect, forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import FriendRequest from "./FriendRequest";
import NotificationSkeleton from "../Notification.skeleton";

import { useAuth } from "../../../../contexts/AuthContext";

import useFetch from "../../../../hooks/useFetch";

import "./FriendRequests.css";

const FriendRequests = forwardRef((_, ref) => {
  const { authState, setAuthInfo } = useAuth();
  const [{ data, isLoading, error }, doFetch] = useFetch(
    `http://${process.env.HOST}:3000/api/friend-requests`,
    {
      isLoadingOnMount: true,
    }
  );

  // Fetch all currently pending friend requests
  useEffect(() => {
    doFetch({
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }, [doFetch]);

  return (
    <div className="friendRequests" ref={ref}>
      <h1 className="friendRequests__title">FakeMate Requests</h1>

      {isLoading && (
        <div className="friendRequests__skeletons">
          <NotificationSkeleton context="friendRequest" />
          <NotificationSkeleton context="friendRequest" />
        </div>
      )}

      {!isLoading && data?.body.length > 0 && (
        <ul className="friendRequests__list">
          {data.body.map((fr) => (
            <FriendRequest
              key={fr._id}
              fr={fr}
              authState={authState}
              setAuthInfo={setAuthInfo}
            />
          ))}
        </ul>
      )}

      {!isLoading && data?.body.length === 0 && (
        <p className="friendRequests__noRequestsMsg">
          Nobody wants to be your friend.
        </p>
      )}

      {!isLoading && error && (
        <div className="friendRequests__error">
          <FontAwesomeIcon
            className="friendRequests__errorIcon"
            icon={faTriangleExclamation}
          />
          <p className="friendRequests__errorMsg">
            Something went pear-shaped.
          </p>
        </div>
      )}
    </div>
  );
});

export default FriendRequests;
