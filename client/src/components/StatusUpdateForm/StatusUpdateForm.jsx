import { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import EmojiPicker from '../EmojiPicker/EmojiPicker';

import { VALID_MIME_TYPES } from '../../constants';

import { useAuth } from '../../contexts/AuthContext';

import formatFileSize from '../../utils/formatFileSize.util';

import './StatusUpdateForm.css';

const StatusUpdateForm = ({ setPosts }) => {
  const [isVisiblePicker, setIsVisiblePicker] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { authState: { currentUser } } = useAuth();

  const initialValues = {
    content: '',
    image: null,
  };

  const validationSchema = Yup.object({
    content: Yup.string()
      .max(100, 'Must be less than 100 characters')
      .required('Please write something...'),
    image: Yup.mixed()
      // If value is null, validation also passes since user hasn't selected an image
      .test('fileSize', 'File must be less than 4MB', (value) => value ? value.size < (1024 * 1024 * 4) : true)
      .test('fileType', 'File must be a JPG, JPEG, or PNG', (value) => value ? VALID_MIME_TYPES.includes(value.type) : true)
  });

  const handleSubmit = async (values, { resetForm }) => {
    // NOTE 1
    try {
      let formData = new FormData();

      formData.append('content', values.content);
      if (values.image) formData.append('image', values.image);

      const res = await fetch('http://192.168.8.146:3000/api/posts', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        body: formData,
      });

      const body = await res.json();

      if (!res.ok) throw new Error(body);

      // Display new post first in timeline
      setPosts((prevPosts) => [body, ...prevPosts]);
    } catch (err) {
      console.log(err.message);
    } finally {
      resetForm({
        values: {
          content: '',
          image: null,
        },
      });

      setThumbnailUrl('');
    }
  };

  const handleFileChange = (e, setFieldValue) => {
    const file = e.currentTarget.files[0];

    setFieldValue('image', file);

    // Generate a temporary URL for the file to be used as thumbnail src
    setThumbnailUrl(URL.createObjectURL(file));
  };

  const removeThumbnail = (setFieldValue) => {
    setFieldValue('image', null);
    setThumbnailUrl('');
  };

  const resetFormData = (resetForm) => {
    resetForm({
      values: {
        content: '',
        image: null,
      },
    });

    setThumbnailUrl('');
  };

  // Close emoji picker on outside click
  useEffect(() => {
    const handleMouseDown = (e) => {
      // Check if user has clicked inside Picker element (okay)
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        // Stop event propagation here so that if user clicks picker toggle button whilst the
        // picker is open, that toggle's handler won't execute which would simply negate this action
        e.stopPropagation();
        setIsVisiblePicker(false);
      }
    };

    // Add third argument true to ensure handler runs during capture phase so that event propagation
    // can be stopped after this handler runs but before picker toggle button's handler runs
    document.addEventListener('mousedown', handleMouseDown, true);
    // document.addEventListener('touchstart', handleMouseDown, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      // document.removeEventListener('touchstart', handleMouseDown, true);
    };
  }, [emojiPickerRef]);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({
        values,
        touched,
        errors,
        isSubmitting,
        setFieldValue,
        setFieldTouched,
        resetForm
      }) => (
        <Form className="statusUpdateForm" autoComplete="off" noValidate>
          <div className="statusUpdateForm__formGroup">
            <Field
              className={`statusUpdateForm__input statusUpdateForm__content ${ (touched.content && errors.content) ? "statusUpdateForm__fieldError" : "" }`}
              as="textarea"
              name="content"
              placeholder={`What's on your mind, ${ currentUser.firstName }?`}
              aria-label="Status update message"
            />
            <ErrorMessage className="statusUpdateForm__feedbackError" name="content" component="div" />
          </div>
          <div className="statusUpdateForm__options">
            <input
              className="statusUpdateForm__input statusUpdateForm__input--file"
              type="file"
              name="image"
              aria-label="Status update image"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setFieldValue)}
              ref={fileInputRef}
            />
            <button
              className="statusUpdateForm__addImage"
              type="button"
              onClick={() => fileInputRef.current.click()} // Programmatically click input[type="file"] field
              onBlur={() => setFieldTouched('image', true)} // Set touched.image to true, and thereby trigger validation
            >
              <FontAwesomeIcon className="statusUpdateForm__icon" icon={faImage} />
            </button>
            <button
              className="statusUpdateForm__showEmojiPicker"
              type="button"
              onMouseDown={() => setIsVisiblePicker((prevValue) => !prevValue)} // onMouseDown means I can prevent handler executing by using stopPropagation elsewhere
            >
              <FontAwesomeIcon className="statusUpdateForm__icon" icon={faFaceSmile} />
            </button>
            <button className="statusUpdateForm__button statusUpdateForm__button--reset" type="reset" onClick={() => resetFormData(resetForm)}>RESET</button>
            <button className="statusUpdateForm__button statusUpdateForm__button--submit" type="submit" disabled={isSubmitting}>SEND</button>
          </div>
          {isVisiblePicker && (
            <EmojiPicker
              ref={emojiPickerRef}
              content={values.content}
              setFieldValue={setFieldValue}
              setFieldTouched={setFieldTouched}
              setIsVisiblePicker={setIsVisiblePicker}
            />
          )}
          {thumbnailUrl && (
            <div>
              <div className={`statusThumbnail ${ errors.image ? "statusThumbnail--error" : "" }`}>
                <img className="statusThumbnail__image" alt="" src={ thumbnailUrl } />
                <div className="statusThumbnail__fileInfo">
                  <span className="statusThumbnail__fileName">{values.image.name}</span>
                  <span className="sattusThumbnail__fileSize">{formatFileSize(values.image.size)}</span>
                </div>
                <FontAwesomeIcon
                  className="statusThumbnail__remove statusUpdateForm__icon"
                  icon={faXmark}
                  onClick={() => removeThumbnail(setFieldValue)}
                  />
              </div>
              <ErrorMessage className="statusUpdateForm__feedbackError" name="image" component="div" />
            </div>
          )}
        </Form>
      )}
    </Formik>
  );
};

export default StatusUpdateForm;

// NOTE 1
// When sending multipart/form-data you must use FormData, and must
// **not** include the Content-Type in the headers; the browser will
// set this plus the boundary.  JSON.stringify is used for
// application/json data.
// multipart/form-data = FormData, application/json = JSON.stringify
