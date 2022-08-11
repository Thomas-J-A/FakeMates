const Joi = require('joi');

const fetchChatsQuery = Joi.object({
  type: Joi.string()
    .valid('private', 'group')
    .required()
    .messages({
      'any.only': 'Type must be either \'private\' or \'group\'',
      'any.required': 'Type is required',
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

module.exports = {
  fetchChats: {
    query: fetchChatsQuery,
  },
};
