import { useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

import './Drawer.css';

const Drawer = ({ isOpen, closeDrawer }) => {
  const initialValues = {
    email: '',
    password: '',
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required'),
  });

  const handleSubmit = async () => {
    try {
      console.log('submitted form');
    } catch (err) {
      console.log(err);
    }
  };

  const signInWithGoogle = () => {
    console.log('Signed in via Google');
  };

  // Close drawer by pressing esc key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
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
        >
        {({ touched, errors, isSubmitting }) => (
          <Form className="drawerForm" autoComplete="off" noValidate>
            <div className="drawerForm__form-group">
              <Field
                className={`drawerForm__input ${ touched.email && errors.email && "drawerForm__fieldError" }`}
                type="email"
                name="email"
                placeholder="Email"
                aria-label="email"
              />
              <ErrorMessage name="email" component="div" className="drawerForm__feedbackError" />
            </div>
            <div className="drawerForm__form-group">
              <Field
                className={`drawerForm__input ${ touched.pasword && errors.email && "drawerForm__fieldError" }`}
                type="password"
                name="password"
                placeholder="Password"
                aria-label="password"
              />
              <ErrorMessage name="password" component="div" className="drawerForm__feedbackError" />
            </div>
            <button className="drawerForm__submit" type="submit" disabled={isSubmitting}>Sign In</button>
          </Form>
        )}
      </Formik>
      <div className="orSeparator">
        <div className="orSeparator__line" />
        <p className="orSeparator__text">OR</p>
        <div className="orSeparator__line" />
      </div>
      <button
        className="drawer__google"
        type="button"
        onClick={signInWithGoogle}
      >
        <FontAwesomeIcon icon={faGoogle} />
        Sign In With Google
      </button>
      <button
        className="drawer__close"
        type="button"
        onClick={closeDrawer}
      >
        X
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
