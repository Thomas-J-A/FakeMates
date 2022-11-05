import { useEffect, useRef } from 'react';
import { Formik, Form, ErrorMessage, Field } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';

import { useAuth } from '../../contexts/AuthContext';

import './EditInfoModal.css';

// Find only values that have changed during Formik submission
const getModifiedValues = (values, initialValues) => {
  return Object.entries(values).reduce((prev, current) => {
    const key = current[0];
    const value = current[1].trim();

    return (value !== initialValues[key])
      ? { ...prev, [key]: value }
      : prev;
  }, {})
};

const EditInfoModal = ({ isOpen, closeModal, userData, setUserData }) => {
  const formRef = useRef(null);
  const { authState: { currentUser } } = useAuth();

  const initialValues = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    bio: userData.bio || '',
    location: userData.location || '',
    hometown: userData.hometown || '',
    occupation: userData.occupation || '',
  };

  const validationSchema = Yup.object({
    firstName: Yup.string()
      .trim()
      .required('Required'),
    lastName: Yup.string()
      .trim()
      .required('Required'),
    bio: Yup.string(),
    location: Yup.string(),
    hometown: Yup.string(),
    occupation: Yup.string(),
  });

  const handleSubmit = async (values) => {
    try {
      // Only send fields that user has changed
      const modifiedValues = getModifiedValues(values, initialValues);

      // If change to field is simply whitespace, don't submit
      if (Object.keys(modifiedValues).length === 0) return;

      const res = await fetch(`http://192.168.8.146:3000/api/users/${ currentUser._id }?action=edit`, {
        method: 'PUT',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modifiedValues),
      });

      const body = await res.json();

      if (!res.ok) throw new Error(body);

      setUserData(body);
    } catch (err) {
      console.log(err);
    } finally {
      closeModal()
    }
  };

  // Reset fields when closing modal
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => formRef.current?.resetForm(), 300);
    }
  }, [isOpen]);

  return (
    <div className={`editInfoModal ${ isOpen ? "editInfoModal--open" : "" }`}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
        innerRef={formRef}
      >
        {({ touched, errors, isSubmitting, dirty }) => (
          <Form className="editInfoModal__form" autoComplete="off" noValidate>
            <header className="editInfoModal__header">
              <h1 className="editInfoModal__title">Edit Profile</h1>
              <FontAwesomeIcon
                className="editInfoModal__exit"
                icon={faXmark}
                onClick={closeModal}
              />
            </header>
            <div className="editInfoModal__formBody">
              <div className="editInfoModal__namesWrapper">
                <div className="editInfoModal__formGroup editInfoModal__formGroup--halfSize">
                  <label className="editInfoModal__label" htmlFor="editInfoModal__firstName">First Name</label>
                  <Field
                    className={`editInfoModal__input ${ (touched.firstName && errors.firstName) ? "editInfoModal__fieldError" : "" }`}
                    id="editInfoModal__firstName"
                    type="text"
                    name="firstName"
                  />
                  <ErrorMessage className="editInfoModal__feedbackError" name="firstName" component="div" />
                </div>
                <div className="editInfoModal__formGroup editInfoModal__formGroup--halfSize">
                  <label className="editInfoModal__label" htmlFor="editInfoModal__lastName">Last Name</label>
                  <Field
                    className={`editInfoModal__input ${ (touched.lastName && errors.lastName) ? "editInfoModal__fieldError" : "" }`}
                    id="editInfoModal__lastName"
                    type="text"
                    name="lastName"
                  />
                  <ErrorMessage className="editInfoModal__feedbackError" name="lastName" component="div" />
                </div>
              </div>
              <div className="editInfoModal__formGroup">
                <label className="editInfoModal__label" htmlFor="editInfoModal__bio">Bio</label>
                <Field
                  className={`editInfoModal__bio ${ (touched.bio && errors.bio) ? "editInfoModal__fieldError" : "" }`}
                  as="textarea"
                  name="bio"
                  placeholder="A little introduction..."
                />
                <ErrorMessage className="editInfoModal__feedbackError" name="bio" component="div" />
              </div>
              <div className="editInfoModal__locationsWrapper">
                <div className="editInfoModal__formGroup editInfoModal__formGroup--halfSize">
                  <label className="editInfoModal__label" htmlFor="editInfoModal__location">Location (City)</label>
                  <Field
                    className={`editInfoModal__input ${ (touched.location && errors.location) ? "editInfoModal__fieldError" : "" }`}
                    id="editInfoModal__location"
                    type="text"
                    name="location"
                    placeholder="I live in..."
                  />
                  <ErrorMessage className="editInfoModal__feedbackError" name="location" component="div" />
                </div>
                <div className="editInfoModal__formGroup editInfoModal__formGroup--halfSize">
                  <label className="editInfoModal__label" htmlFor="editInfoModal__hometown">Hometown</label>
                  <Field
                    className={`editInfoModal__input ${ (touched.hometown && errors.hometown) ? "editInfoModal__fieldError" : "" }`}
                    id="editInfoModal__hometown"
                    type="text"
                    name="hometown"
                    placeholder="I come from..."
                  />
                  <ErrorMessage className="editInfoModal__feedbackError" name="hometown" component="div" />
                </div>
              </div>
              <div className="editInfoModal__formGroup">
                <label className="editInfoModal__label" htmlFor="editInfoModal__occupation">Occupation</label>
                <Field
                  className={`editInfoModal__input ${ (touched.occupation && errors.occupation) ? "editInfoModal__fieldError" : "" }`}
                  id="editInfoModal__occupation"
                  type="text"
                  name="occupation"
                  placeholder="I work as a..."
                />
                <ErrorMessage className="editInfoModal__feedbackError" name="occupation" component="div" />
              </div>
              <button className="editInfoModal__submit" type="submit" disabled={isSubmitting || !dirty}>
                <FontAwesomeIcon className="editInfoModal__confirmIcon" icon={faCircleCheck}/>
                CONFIRM
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditInfoModal;
