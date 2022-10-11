import { forwardRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import { useAuth } from '../../contexts/AuthContext';

import './SignInForm.css';

const SignInForm = forwardRef((props, ref) => {
  const { logIn } = useAuth();

  const initialValues = {
    email: '',
    password: '',
  };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email')
      .required('Please enter an email'),
    password: Yup.string()
      .required('Please enter a password'),
  });
  
  const handleSubmit = async (values, { setFieldError }) => {
    // 'http://localhost:3000/api/auth/email';

    try {
      const res = await fetch('http://192.168.8.146:3000/api/auth/email', {
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

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      innerRef={ref}
    >
      {({ touched, errors, isSubmitting }) => (
        <Form className="signInForm" autoComplete="off" noValidate>
          <div className="signInForm__formGroup">
            <Field
              className={`signInForm__input ${ (touched.email && errors.email) ? "signInForm__fieldError" : "" }`}
              type="email"
              name="email"
              placeholder="Email"
              aria-label="email"
            />
            <ErrorMessage className="signInForm__feedbackError" name="email" component="div" />
          </div>
          <div className="signInForm__formGroup">
            <Field
              className={`signInForm__input ${ (touched.password && errors.password) ? "signInForm__fieldError" : "" }`}
              type="password"
              name="password"
              placeholder="Password"
              aria-label="password"
            />
            <ErrorMessage className="signInForm__feedbackError" name="password" component="div" />
          </div>
          <button className="signInForm__submit" type="submit" disabled={isSubmitting}>SIGN IN</button>
        </Form>
      )}
    </Formik>
  );
});

export default SignInForm;
