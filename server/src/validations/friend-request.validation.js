const Joi = require('joi');

const objectId = /^[0-9a-fA-F]{24}$/;

const sendFriendRequestQuery = Joi.object({
  to: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.empty': 'Recipient must not be empty',
      'string.pattern.base': 'Recipient must be a valid ObjectId',
      'any.required': 'Recipient is required',
    }),
});

const handleFriendRequestParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': 'ID must be a valid ObjectId',
      'any.required': 'ID is required',
    }),
})

const handleFriendRequestQuery = Joi.object({
  accept: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'Accept must be a Boolean value',
      'any.required': 'Accept is required',
    }),
});


module.exports = {
  sendFriendRequest: {
    query: sendFriendRequestQuery,
  },
  handleFriendRequest: {
    params: handleFriendRequestParams,
    query: handleFriendRequestQuery,
  },
};
