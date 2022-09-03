import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import Backdrop from '../../components/Backdrop/Backdrop';
import Drawer from '../../components/Drawer/Drawer';

import './Landing.css';

const Landing = ({ isOpen, closeDrawer }) => {
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

  const handleSubmit = async () => {
    try {
      console.log('submitted');
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="landing__wrapper">
      <main className="landing">
        <p className="landing__text">Join FakeMates and connect with around 30 people across the globe</p>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ touched, errors, isSubmitting }) => (
            <Form className="registerForm" autoComplete="off" noValidate>
              <h1 className="registerForm__title">Create A New Account</h1>
              <h2 className="registerForm__subtitle">It's quick and free (just data)</h2>
              <div className="registerForm__namesWrapper">
                <div className="registerForm__formGroup registerForm__formGroup--halfSize">
                  <label htmlFor="registerForm__firstName">First Name</label>
                  <Field
                    className={`registerForm__input ${ touched.firstName && errors.firstName ? "registerForm__fieldError" : "" }`}
                    id="registerForm__firstName"
                    type="text"
                    name="firstName"
                    placeholder="Marcus"
                  />
                  <ErrorMessage className="registerForm__feedbackError" name="firstName" component="div" />
                </div>
                <div className="registerForm__formGroup registerForm__formGroup--halfSize">
                  <label htmlFor="registerForm__lastName">Last Name</label>
                  <Field
                    className={`registerForm__input ${ touched.lastName && errors.lastName ? "registerForm__fieldError" : "" }`}
                    id="registerForm__lastName"
                    type="text"
                    name="lastName"
                    placeholder="Aurelius"
                  />
                  <ErrorMessage className="registerForm__feedbackError" name="lastName" component="div" />
                </div>
              </div>
              <div className="registerForm__formGroup">
                <label htmlFor="registerForm__email">Email</label>
                <Field
                  className={`registerForm__input ${ touched.email && errors.email ? "registerForm__fieldError" : "" }`}
                  id="registerForm__email"
                  type="email"
                  name="email"
                  placeholder="marco@gmail.com"
                />
                <ErrorMessage className="registerForm__feedbackError" name="email" component="div" />
              </div>
              <div className="registerForm__formGroup">
                <label htmlFor="registerForm__password">Password</label>
                <Field
                  className={`registerForm__input ${ touched.password && errors.password ? "registerForm__fieldError" : "" }`}
                  id="registerForm__password"
                  type="password"
                  name="password"
                  placeholder="********"
                />
                <ErrorMessage className="registerForm__feedbackError" name="password" component="div" />
              </div>
              <div className="registerForm__formGroup">
                <label htmlFor="registerForm__confirmPassword">Confirm Password</label>
                <Field
                  className={`registerForm__input ${ touched.confirmPassword && errors.confirmPassword ? "registerForm__fieldError" : "" }`}
                  id="registerForm__confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="********"
                />
                <ErrorMessage className="registerForm__feedbackError" name="confirmPassword" component="div" />
              </div>
              <button className="registerForm__submit" type="submit" disabled={ isSubmitting }>Create Account</button>
            </Form>
          )}
        </Formik>
      </main>
      <Backdrop isVisible={isOpen} closeDrawer={closeDrawer} />
      <Drawer isOpen={isOpen} closeDrawer={closeDrawer} />
    </div>
  );
};

export default Landing;
