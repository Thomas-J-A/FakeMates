import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faMessage } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowRightFromBracket,
  faUserXmark,
} from "@fortawesome/free-solid-svg-icons";

import SignInForm from "../../SignInForm/SignInForm";
import GoogleSignIn from "../../GoogleSignIn/GoogleSignIn";
import SearchBar from "../../SearchBar/SearchBar";
import ToggleSwitch from "../../ToggleSwitch/ToggleSwitch";

import { useAuth } from "../../../contexts/AuthContext";

import useMediaQuery from "../../../hooks/useMediaQuery";

import "./MainMenu.css";

const MainMenu = ({ isOpen, closeDrawer }) => {
  const {
    authState: { currentUser },
    logOut,
    isAuthenticated,
  } = useAuth();
  const formRef = useRef(null);
  const isNarrowEnoughForLinks = useMediaQuery("(max-width: 809px)");
  const isNarrowEnoughForSearchBar = useMediaQuery("(max-width: 1000px)");

  // Clear signin form input fields when drawer closes
  useEffect(() => {
    const clearFields = () => {
      formRef.current.resetForm();
    };

    if (!isOpen && formRef.current) {
      setTimeout(clearFields, 300);
    }
  }, [isOpen]);

  // Sign user out
  const handleSignOut = async () => {
    try {
      const res = await fetch(
        `http://${process.env.HOST}:3000/api/auth/logout`,
        {
          method: "POST",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 204) {
        // Logout attempt successful
        return logOut();
      }

      if (res.status === 500) {
        // Unknown 500 error on server
        const body = await res.json();
        throw new Error(body.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteAccount = () => {
    console.log("Deleting account");
  };

  return (
    <div className="mainMenu">
      {isAuthenticated() ? (
        <>
          {isNarrowEnoughForSearchBar && <SearchBar isOpen={isOpen} />}
          {isNarrowEnoughForLinks && (
            <nav className="mainMenuNav">
              <ul className="mainMenuNav__list">
                <li className="mainMenuNav__item">
                  <Link
                    className="mainMenuNav__link"
                    to={`/profile/${currentUser._id}`}
                    onClick={closeDrawer}
                  >
                    <FontAwesomeIcon
                      className="mainMenuNav__linkIcon"
                      icon={faCircleUser}
                    />
                    <span className="mainMenuNav__linkText">Profile</span>
                  </Link>
                </li>
                <li className="mainMenuNav__item">
                  <Link
                    className="mainMenuNav__link"
                    to="/messenger"
                    onClick={closeDrawer}
                  >
                    <FontAwesomeIcon
                      className="mainMenuNav__linkIcon"
                      icon={faMessage}
                    />
                    <span className="mainMenuNav__linkText">Messenger</span>
                  </Link>
                </li>
              </ul>
            </nav>
          )}
          <ToggleSwitch
            isChecked={currentUser.isPrivate}
            id={currentUser._id}
          />
          <div className="mainMenu__buttons">
            <button
              className="mainMenu__signOut"
              type="button"
              onClick={handleSignOut}
            >
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
              SIGN OUT
            </button>
            <button
              className="mainMenu__deleteAccount"
              type="button"
              onClick={handleDeleteAccount}
            >
              <FontAwesomeIcon icon={faUserXmark} />
              DELETE ACCOUNT
            </button>
          </div>
        </>
      ) : (
        <>
          <SignInForm ref={formRef} />
          <div className="orSeparator">
            <div className="orSeparator__line" />
            <p className="orSeparator__text">OR</p>
            <div className="orSeparator__line" />
          </div>
          <GoogleSignIn />
        </>
      )}
    </div>
  );
};

export default MainMenu;
