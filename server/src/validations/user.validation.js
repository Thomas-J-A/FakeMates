const Joi = require('joi');

const objectId = /^[0-9a-fA-F]{24}$/;

const fetchUserInfoParams = Joi.object({
  id: Joi.string()
  .regex(objectId)
  .required()
  .messages({
    'string.pattern.base': ':id must be a valid ObjectId',
    'any.required': ':id is required',
  }),
});

const updateUserInfoParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': ':id must be a valid ObjectId',
      'any.required': ':id is required',
    }),
});

const updateUserInfoQuery = Joi.object({
  action: Joi.string()
    .valid('edit', 'unfriend', 'logout')
    .required()
    .messages({
      'any.only': 'action must be one of \'edit\', \'unfriend\', or \'logout\'',
      'any.required': 'action is required',
    }),

  // if action === unfriend, additionally validate friendid query parameter
  friendid: Joi.when('action', {
    is: 'unfriend',
    then: Joi.string()
      .regex(objectId)
      .required()
      .messages({
        'string.pattern.base': 'friendid must be a valid ObjectId',
        'any.required': 'friendid is required',
      }),
  }),
});

const updateUserInfoBody = Joi.object({
  firstName: Joi.string()
    .trim()
    .optional(),
  lastName: Joi.string()
    .trim()
    .optional(),
  bio: Joi.string()
    .trim()
    .optional(),
  location: Joi.string()
    .trim()
    .optional(),
  hometown: Joi.string()
    .trim()
    .optional(),
  occupation: Joi.string()
    .trim()
    .optional(),
});

const deleteAccountParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': ':id must be a valid ObjectId',
      'any.required': ':id is required',
    }),
});

module.exports = {
  fetchUserInfo: {
    params: fetchUserInfoParams,
  },
  updateUserInfo: {
    params: updateUserInfoParams,
    query: updateUserInfoQuery,
    body: updateUserInfoBody,
  },
  deleteAccount: {
    params: deleteAccountParams,
  },
};
