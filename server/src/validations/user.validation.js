const Joi = require('joi');

const objectId = /^[0-9a-fA-F]{24}$/;

const fetchUserInfoParams = Joi.object({
  id: Joi.string()
  .regex(objectId)
  .required()
  .messages({
    'string.pattern.base': 'ID must be a valid ObjectId',
    'any.required': 'ID is required',
  }),
});

const updateUserInfoParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': 'ID must be a valid ObjectId',
      'any.required': 'ID is required',
    }),
});

const updateUserInfoQuery = Joi.object({
  action: Joi.string()
    .valid('edit', 'unfriend', 'logout', 'upload', 'change-visibility')
    .required()
    .messages({
      'any.only': 'Action must be one of \'edit\', \'unfriend\', \'logout\', \'upload\', or \'change-visibility\'',
      'any.required': 'Action is required',
    }),

  // if action === unfriend, additionally validate friendid query parameter
  friendid: Joi.when('action', {
    is: 'unfriend',
    then: Joi.string()
      .regex(objectId)
      .required()
      .messages({
        'string.empty': 'Friend ID must not be empty',
        'string.pattern.base': 'Friend ID must be a valid ObjectId',
        'any.required': 'Friend ID is required',
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
      'string.pattern.base': 'ID must be a valid ObjectId',
      'any.required': 'ID is required',
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
