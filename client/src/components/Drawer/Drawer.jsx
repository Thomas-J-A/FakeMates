import { useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { GoogleOAuthProvider } from '@react-oauth/google';

import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';

import { useAuth } from '../../contexts/AuthContext';

import './Drawer.css';

const Drawer = ({ isOpen, closeDrawer }) => {
  const formRef = useRef(null);
  const { logIn } = useAuth();

  const initialValues = {
    email: '',
    password: '',
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email')
      .required('*Required'),
    password: Yup.string()
      .required('*Required'),
  });

  const handleSubmit = async (values, { setFieldError }) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/email', { // http://192.168.8.146:3000/api/auth/email
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const body = await res.json();

      if (res.status === 200) {
        return logIn(body);
      }

      // Both types of responses share same object shape
      if (res.status === 400 || res.status === 401) {
        return setFieldError(body.key, body.message);
      }

      if (res.status === 500) {
        throw new Error(body.message);
      }
    } catch (err) {
      // TODO: Remove in production env
      console.log(err);
    }
  };

  // Clear input fields when drawer closes
  useEffect(() => {
    const clearFields = () => {
      formRef.current.resetForm();
    };

    if (!isOpen) {
      setTimeout(clearFields, 300);
    }
  }, [isOpen]);

  // Close drawer by pressing esc key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        // If any input in drawer is focused, remove focus
        e.target.blur();
        closeDrawer();
      }
    };

    if (isOpen) {
      window.addEventListener('keyup', handleKeyPress);
    }

    return () => {
      window.removeEventListener('keyup', handleKeyPress);
    }
  }, [isOpen, closeDrawer]);

  return (
    <div className={`drawer ${ isOpen ? "drawer--open" : "" }`}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        innerRef={formRef}
      >
        {({ touched, errors, isSubmitting }) => (
          <Form className="drawerForm" autoComplete="off" noValidate>
            <div className="drawerForm__formGroup">
              <Field
                className={`drawerForm__input ${ (touched.email && errors.email) ? "drawerForm__fieldError" : "" }`}
                type="email"
                name="email"
                placeholder="Email"
                aria-label="email"
              />
              <ErrorMessage className="drawerForm__feedbackError" name="email" component="div" />
            </div>
            <div className="drawerForm__formGroup">
              <Field
                className={`drawerForm__input ${ (touched.password && errors.password) ? "drawerForm__fieldError" : "" }`}
                type="password"
                name="password"
                placeholder="Password"
                aria-label="password"
              />
              <ErrorMessage className="drawerForm__feedbackError" name="password" component="div" />
            </div>
            <button className="drawerForm__submit" type="submit" disabled={isSubmitting}>SIGN IN</button>
          </Form>
        )}
      </Formik>
      <div className="orSeparator">
        <div className="orSeparator__line" />
        <p className="orSeparator__text">OR</p>
        <div className="orSeparator__line" />
      </div>
      <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>
        <GoogleSignIn />
      </GoogleOAuthProvider>
      <button
        className="closeDrawer"
        type="button"
        onClick={closeDrawer}
      >
        <FontAwesomeIcon className="closeDrawer__icon" icon={faChevronRight} />
      </button>
    </div>
  );
};

export default Drawer;


// const bodyRef = useRef(document.querySelector('body'));

// // Prevent scrolling when drawer is open
// useEffect(() => {
//   const updatePageScroll = () => {
//     if (isOpen) {
//       bodyRef.current.style.overflow = 'hidden';
//     } else {
//       bodyRef.current.style.overflow = '';
//     }
//   };

//   updatePageScroll();
// }, [isOpen]);





  // const isMounted = useRef(false);
    // // Not necessary to reset fields on mount
    // if (!isMounted.current) {
    //   console.log('isMounted ref changed')
    //   isMounted.current = true;
