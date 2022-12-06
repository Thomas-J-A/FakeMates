import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi } from '@fortawesome/free-solid-svg-icons';

import './CommentForm.css';

const CommentForm = ({ handleSubmit }) => {
  const initialValues = {
    content: '',
  };

  const validationSchema = Yup.object({
    content: Yup.string()
      .max(100, 'Must be less than 100 characters')
      .required('Please write something...')
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ touched, errors, isSubmitting, status }) => (
        <Form className="commentForm" autoComplete="off" noValidate>
          {status && (
            <div className="commentFormNetworkError">
              <FontAwesomeIcon className="commentFormNetworkError__icon" icon={faWifi} />
              <p className="commentFormNetworkError__text">{status}</p>
            </div>
          )}
          <div className="commentForm__formGroup">
            <Field
              className={`commentForm__input ${ (touched.content && errors.content) ? "commentForm__fieldError" : "" }`}
              as="textarea"
              name="content"
              placeholder="Say something insightful..."
              aria-label="Add a comment"
            />
            <ErrorMessage className="commentForm__feedbackError" name="content" component="div" />
          </div>
          <button className="commentForm__submit" type="submit" disabled={isSubmitting}>SUBMIT</button>
        </Form>
      )}
    </Formik>
  );
};

export default CommentForm;
