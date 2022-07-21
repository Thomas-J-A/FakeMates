const Joi = require('joi');

const objectId = /^[0-9a-fA-F]{24}$/;

const sendFriendRequestQuery = Joi.object({
  to: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': 'to must be a valid ObjectId',
      'any.required': 'to is required',
    }),
});

const handleFriendRequestParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': ':id must be a valid ObjectId',
      'any.required': ':id is required',
    }),
})

const handleFriendRequestQuery = Joi.object({
  accept: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'accept must be a Boolean value',
      'any.required': 'accept is required',
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
