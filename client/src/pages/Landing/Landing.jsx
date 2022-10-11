import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import { useAuth } from '../../contexts/AuthContext';

import './Landing.css';
import heroImage from '../../../public/images/landing-hero.png';

const Landing = () => {
  const { logIn } = useAuth();

  const initialValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  const validationSchema = Yup.object({
    firstName: Yup.string()
      .required('Required'),
    lastName: Yup.string()
      .required('Required'),
    email: Yup.string()
      .email('Invalid email')
      .required('Required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .max(20, 'Password must be less than 20 characters')
      .required('Required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Required'),
  });

  const handleSubmit = async (values, { setFieldError }) => {
    // 'http://localhost:3000/api/auth/register'

    try {
      const res = await fetch('http://192.168.8.146:3000/api/auth/register', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
        }),
      });

      const body = await res.json();

      if (res.status === 201) {
        // Registration attempt successful
        return logIn(body);
      }
      
      if (res.status === 400 || res.status === 409) {
        // 401 => Validation error on server (malicious users can disable front-end validation)
        // 409 => Email already exists
        // Both types of responses share same object shape
        // Update Formik errors to render error in UI
        return setFieldError(body.key, body.message);
      }

      if (res.status === 500) {
        // Unknown 500 error on server
        throw new Error(body.message);
      }
    } catch (err) {
      // TODO: remove in production env
      console.log(err);
    }
  };

  return (
    <div className="landing">
      <div className="hero">
        <p className="hero__mainText">
          Join FakeMates and connect with around 30 people across the globe
          <span className="hero__spanText"> - one is in Peru!</span>
        </p>
        <img className="hero__image" src={heroImage} alt="Globe with interconnected lines" />
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ touched, errors, isSubmitting }) => (
          <Form className="registerForm" autoComplete="off" noValidate>
            <header className="registerForm__header">
              <h1 className="registerForm__title">Create A New Account</h1>
              <h2 className="registerForm__subtitle">It's quick and free (only data)</h2>
            </header>
            <div className="registerForm__namesWrapper">
              <div className="registerForm__formGroup registerForm__formGroup--halfSize">
                <label className="registerForm__label" htmlFor="registerForm__firstName">First Name</label>
                <Field
                  className={`registerForm__input ${(touched.firstName && errors.firstName) ? "registerForm__fieldError" : ""}`}
                  id="registerForm__firstName"
                  type="text"
                  name="firstName"
                  placeholder="Marcus"
                />
                <ErrorMessage className="registerForm__feedbackError" name="firstName" component="div" />
              </div>
              <div className="registerForm__formGroup registerForm__formGroup--halfSize">
                <label className="registerForm__label" htmlFor="registerForm__lastName">Last Name</label>
                <Field
                  className={`registerForm__input ${(touched.lastName && errors.lastName) ? "registerForm__fieldError" : ""}`}
                  id="registerForm__lastName"
                  type="text"
                  name="lastName"
                  placeholder="Aurelius"
                />
                <ErrorMessage className="registerForm__feedbackError" name="lastName" component="div" />
              </div>
            </div>
            <div className="registerForm__formGroup">
              <label className="registerForm__label" htmlFor="registerForm__email">Email</label>
              <Field
                className={`registerForm__input ${(touched.email && errors.email) ? "registerForm__fieldError" : ""}`}
                id="registerForm__email"
                type="email"
                name="email"
                placeholder="marco@gmail.com"
              />
              <ErrorMessage className="registerForm__feedbackError" name="email" component="div" />
            </div>
            <div className="registerForm__formGroup">
              <label className="registerForm__label" htmlFor="registerForm__password">Password</label>
              <Field
                className={`registerForm__input ${(touched.password && errors.password) ? "registerForm__fieldError" : ""}`}
                id="registerForm__password"
                type="password"
                name="password"
                placeholder="********"
              />
              <ErrorMessage className="registerForm__feedbackError" name="password" component="div" />
            </div>
            <div className="registerForm__formGroup">
              <label className="registerForm__label" htmlFor="registerForm__confirmPassword">Confirm Password</label>
              <Field
                className={`registerForm__input ${(touched.confirmPassword && errors.confirmPassword) ? "registerForm__fieldError" : ""}`}
                id="registerForm__confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="********"
              />
              <ErrorMessage className="registerForm__feedbackError" name="confirmPassword" component="div" />
            </div>
            <button className="registerForm__submit" type="submit" disabled={isSubmitting}>CREATE ACCOUNT</button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Landing;
