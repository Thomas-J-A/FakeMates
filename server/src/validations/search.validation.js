const Joi = require('joi');

const fetchResultsQuery = Joi.object({
  q: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Query must not be empty',
      'any.required': 'Query is required',
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
  fetchResults: {
    query: fetchResultsQuery,
  },
};
