import { useState, useEffect, useRef } from 'react';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { faImage, faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import Skeleton from 'react-loading-skeleton';

import { VALID_MIME_TYPES } from '../../constants';

import { useAuth } from '../../contexts/AuthContext';

import capitalizeFirstLetter from '../../utils/capitalizeFirstLetter.util';

import 'react-loading-skeleton/dist/skeleton.css';
import './ImageUploadModal.css';

// type prop is either 'background' or 'avatar'
const ImageUploadModal = ({ type, isOpen, closeModal, imageUrl, setUserData }) => {
  const [initialThumbnailUrl, setInitialThumbnailUrl] = useState('');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const { authState: { currentUser } } = useAuth();

  const initialValues = {
    [type]: null,
  };

  const validationSchema = Yup.object({
    [type]: Yup.mixed()
      .test('fileSize', 'File must be less than 4MB', (value) => value ? value.size < (1024 * 1024 * 4) : true)
      .test('fileType', 'File must be a JPG, JPEG, or PNG', (value) => value ? VALID_MIME_TYPES.includes(value.type) : true)
  });

  const handleSubmit = async (values) => {
    try {
      let formData = new FormData();

      formData.append(type, values[type]);

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

  const handleFileChange = (e, type, setFieldValue, setFieldTouched) => {
    const file = e.currentTarget.files[0];

    setFieldValue(type, file);

    // Calling setFieldTouched immediately after setFieldValue seems to validate with previous state
    // (due to react batch state updates?); adding third param 'false' updates touched state and
    // triggers a re-render **without** running a faulty validation
    setFieldTouched(type, true, false);

    setNewThumbnailUrl(URL.createObjectURL(file));
  };

  // Fetch background/avatar image to use as initial thumbnail
  useEffect(() => {
    const fetchImage = async () => {
      try {
        const res = await fetch(`http://192.168.8.146:3000/${ imageUrl }`, {
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
    
    fetchImage();
  }, [imageUrl]);

  // Reset thumbnail when closing modal
  useEffect(() => {
    const clearForm = () => {
      formRef.current?.setFieldValue(type, null);
      setNewThumbnailUrl('');
    };

    if (!isOpen) {
      // Modal fades out so remove thumbnail only after modal has
      // completely disappeared from the screen
      setTimeout(clearForm, 300);
    }
  }, [type, isOpen]);

  return (
    <div className={`${ type }UploadModal ${ isOpen ? `${ type }UploadModal--open` : "" }`}>
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
          <Form className={`${ type }UploadModal__form`} autoComplete="off" noValidate>
            <header className={`${ type }UploadModal__header`}>
              <h1 className={`${ type }UploadModal__title`}>Upload {capitalizeFirstLetter(type)}</h1>
              <FontAwesomeIcon
                className={`${ type }UploadModal__exit`}
                icon={faXmark}
                onClick={closeModal}
              />
            </header>
            <div className={`${ type }UploadModal__thumbnailWrapper`}>
              {initialThumbnailUrl
                ? (
                  <img
                  className={`${ type }UploadModal__thumbnail ${ touched[type] && errors[type] ? `${ type }UploadModal__thumbnail--error` : "" }`}
                  src={newThumbnailUrl ? newThumbnailUrl : initialThumbnailUrl}
                  crossOrigin="anonymous"
                  alt=""
                  />
                ) : (
                  <Skeleton height={128} containerClassName={`${ type }UploadModal__skeleton`} />
                )
              }
              <ErrorMessage className={`${ type }UploadModal__feedbackError`} name={type} component="div" />
            </div>
            <div className={`${ type }UploadModal__buttons`}>
              <input
                className={`${ type }UploadModal__input`}
                type="file"
                name={type}
                aria-label={`${ type } image upload`}
                accept="image/*"
                onChange={(e) => handleFileChange(e, type, setFieldValue, setFieldTouched)}
                ref={fileInputRef}
                />
              <button
                className={`${ type }UploadModal__button ${ type }UploadModal__upload`}
                type="button"
                onClick={() => fileInputRef.current.click()}
                // onBlur={() => setFieldTouched('background', true)}
              >
                <FontAwesomeIcon className={`${ type }UploadModal__uploadIcon`} icon={faImage} />
                UPLOAD
              </button>
              <button className={`${ type }UploadModal__button ${ type }UploadModal__confirm`} type="submit" disabled={isSubmitting || !dirty}>
                <FontAwesomeIcon className={`${ type }UploadModal__confirmIcon`} icon={faCircleCheck}/>
                CONFIRM
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ImageUploadModal;
