import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceLaughWink } from '@fortawesome/free-regular-svg-icons';

import './GlobalHeader.css';

const GlobalHeader = ({ isOpen, toggleDrawer }) => {
  return (
    <header className="globalHeader">
      <div className="logo">
        <FontAwesomeIcon className="logo__icon" icon={faFaceLaughWink} />
        <h1 className="logo__name">FakeMates</h1>
      </div>
      <button className="globalHeader__signIn" type="button" onClick={toggleDrawer}>{isOpen ? "CLOSE" : "SIGN IN"}</button>
    </header>
  );
};

export default GlobalHeader;


// const initialValues = {
//   email: '',
//   password: '',
// };

// const validationSchema = Yup.object({
//   email: Yup.string()
//     .email('Invalid email')
//     .required('Email is required'),
//   password: Yup.string()
//     .min(8, 'Password must be at least 8 characters')
//     .max(20, 'Password must be less than 20 characters')
//     .required('Password is required'),
// });

// const handleSubmit = async () => {
//   try {
//     console.log('submitted form');
//   } catch (err) {
//     console.log(err);
//   }
// };

{/* <Formik
  initialValues={initialValues}
  validationSchema={validationSchema}
  onSubmit={handleSubmit}
  >
  {({ touched, errors, isSubmitting }) => (
    <Form autoComplete="off" noValidate>
      <div className="globalHeader__form-group">
        <Field
          type="email"
          name="email"
          placeholder="Email"
          className={`globalHeader__email ${ touched.email && errors.email && "globalHeader__fieldError" }`}
          aria-label="email"
        />
        <ErrorMessage name="email" component="div" className="globalHeader__feedbackError" />
      </div>
      <div className="globalHeader__form-group">
        <Field
          type="password"
          name="password"
          placeholder="Password"
          className={`globalHeader__password ${ touched.pasword && errors.email && "globalHeader__fieldError" }`}
          aria-label="password"
        />
        <ErrorMessage name="password" component="div" className="globalHeader__feedbackError" />
      </div>
      <button type="submit" disabled={isSubmitting}>Sign In</button>
    </Form>
  )}
</Formik> */}
