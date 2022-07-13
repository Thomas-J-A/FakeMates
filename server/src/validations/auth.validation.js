const Joi = require('joi');

const signInWithEmailBody = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      // 'string.min': 'Password must be at least 8 characters',
      // 'string.max': 'Password must be less than 20 characters',
      'any.required': 'Password is required',
    }),
});

const signUpWithEmailBody = Joi.object({
  firstName: Joi.string()
    .required()
    .messages({
      'any.required': 'First name is required',
    }),
  lastName: Joi.string()
    .required()
    .messages({
      'any.required': 'Last name is required',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .max(20)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password must be less than 20 characters',
      'any.required': 'Password is required',
    }),
});

module.exports = {
  signInWithEmail: {
    body: signInWithEmailBody,
  },
  signUpWithEmail: {
    body: signUpWithEmailBody,
  },
};
