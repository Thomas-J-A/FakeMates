const Joi = require('joi');

const fetchResultsQuery = Joi.object({
  q: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'q must not be empty',
      'any.required': 'q is required',
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
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
