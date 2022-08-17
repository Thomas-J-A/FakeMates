const Joi = require('joi');

const objectId = /^[0-9a-fA-F]{24}$/;

const fetchMessagesQuery = Joi.object({
  conversationId: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': 'Conversation ID must be a valid ObjectId',
      'any.required': 'Conversation ID is required',
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be greater than or equal to one',
      'any.required': 'Page is required',
    }),
});

const sendMessageBody = Joi.object({
  conversationId: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': 'Conversation ID must be a valid ObjectId',
      'any.required': 'Conversation ID is required',
    }),
  content: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Content must not be empty',
      'string.max': 'Content must be one hundred characters or less',
      'any.required': 'Content is required',
    }),
});

module.exports = {
  fetchMessages: {
    query: fetchMessagesQuery,
  },
  sendMessage: {
    body: sendMessageBody,
  },
};
