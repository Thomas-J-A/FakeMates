import { useState, useEffect, useRef } from 'react';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { faImage, faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import Skeleton from 'react-loading-skeleton';

import { VALID_MIME_TYPES } from '../../constants';

import { useAuth } from '../../contexts/AuthContext';

import 'react-loading-skeleton/dist/skeleton.css';
import './BackgroundUploadModal.css';

const BackgroundUploadModal = ({ isOpen, closeModal, backgroundUrl, setUserData }) => {
  const [initialThumbnailUrl, setInitialThumbnailUrl] = useState('');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const { authState: { currentUser } } = useAuth();

  const initialValues = {
    background: null,
  };

  const validationSchema = Yup.object({
    background: Yup.mixed()
      .test('fileSize', 'File must be less than 2MB', (value) => value ? value.size < (1024 * 1024 * 2) : true)
      .test('fileType', 'File must be a JPG, JPEG, or PNG', (value) => value ? VALID_MIME_TYPES.includes(value.type) : true)
  });

  const handleSubmit = async (values) => {
    try {
      let formData = new FormData();

      formData.append('background', values.background);

      const res = await fetch(`http://192.168.8.146:3000/api/users/${  currentUser._id }?action=upload`, {
        method: 'PUT',
        mode: 'cors',
        credentials: 'include',
        body: formData,
      });

      const body = await res.json();

      if (!res.ok) throw new Error(body);

      setUserData(body);
      closeModal();
    } catch (err) {
      console.log(err.message);
    }
  };

  const handleFileChange = (e, setFieldValue, setFieldTouched) => {
    const file = e.currentTarget.files[0];

    setFieldValue('background', file);

    // Calling setFieldTouched immediately after setFieldValue seems to validate with previous state
    // (due to react batch state updates?); adding third param 'false' updates touched.background and
    // triggers a re-render **without** running a faulty validation
    setFieldTouched('background', true, false);

    setNewThumbnailUrl(URL.createObjectURL(file));
  };

  // Fetch background image to use as initial thumbnail
  useEffect(() => {
    const fetchBackground = async () => {
      try {
        const res = await fetch(`http://192.168.8.146:3000/${ backgroundUrl }`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
        });

        const body = await res.blob();

        // Generate a temporary URL from blob to use as initial thumbnail src
        setInitialThumbnailUrl(URL.createObjectURL(body));
      } catch (err) {
        console.log(err.message);
      }
    };
    
    fetchBackground();
  }, [backgroundUrl]);

  // Reset thumbnail when closing modal
  useEffect(() => {
    const clearForm = () => {
      formRef.current?.setFieldValue('background', null);
      setNewThumbnailUrl('');
    };

    if (!isOpen) {
      // Modal fades out so remove thumbnail only after modal has
      // completely disappeared from the screen
      setTimeout(clearForm, 300);
    }
  }, [isOpen]);

  return (
    <div className={`backgroundUploadModal ${ isOpen ? "backgroundUploadModal--open" : "" }`}>
      <Formik 
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        innerRef={formRef}
      >
        {({
          touched,
          errors,
          isSubmitting,
          dirty,
          setFieldValue,
          setFieldTouched,
        }) => (
          <Form className="backgroundUploadModal__form" autoComplete="off" noValidate>
            <header className="backgroundUploadModal__header">
              <h1 className="backgroundUploadModal__title">Upload Background</h1>
              <FontAwesomeIcon
                className="backgroundUploadModal__exit"
                icon={faXmark}
                onClick={closeModal}
              />
            </header>
            <div className="backgroundUploadModal__thumbnailWrapper">
              {initialThumbnailUrl
                ? (
                  <img
                  className={`backgroundUploadModal__thumbnail ${ touched.background && errors.background ? "backgroundUploadModal__thumbnail--error" : "" }`}
                  src={newThumbnailUrl ? newThumbnailUrl : initialThumbnailUrl}
                  crossOrigin="anonymous"
                  alt=""
                  />
                  ) : (
                    <Skeleton height={128} containerClassName="backgroundUploadModal__skeleton" />
                )
              }
              <ErrorMessage className="backgroundUploadModal__feedbackError" name="background" component="div" />
            </div>
            <div className="backgroundUploadModal__buttons">
              <input
                className="backgroundUploadModal__input"
                type="file"
                name="background"
                aria-label="Background image upload"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setFieldValue, setFieldTouched)}
                ref={fileInputRef}
                />
              <button
                className="backgroundUploadModal__button backgroundUploadModal__upload"
                type="button"
                onClick={() => fileInputRef.current.click()}
                // onBlur={() => setFieldTouched('background', true)}
              >
                <FontAwesomeIcon className="backgroundUploadModal__uploadIcon" icon={faImage} />
                UPLOAD
              </button>
              <button className="backgroundUploadModal__button backgroundUploadModal__confirm" type="submit" disabled={isSubmitting || !dirty}>
                <FontAwesomeIcon className="backgroundUploadModal__confirmIcon" icon={faCircleCheck}/>
                CONFIRM
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default BackgroundUploadModal;
