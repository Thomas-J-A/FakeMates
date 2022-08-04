const Joi = require('joi');

const objectId = /^[0-9a-fA-F]{24}$/;

const fetchPostsQuery = Joi.object({
  userid: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.empty': 'User ID must not be empty',
      'string.pattern.base': 'User ID must be a valid ObjectId',
      'any.required': 'User ID is required',
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

const createPostBody = Joi.object({
  content: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Content must not be empty',
      'string.max': 'Content must be less than 100 characters',
      'any.required': 'Content is required',
    }),
});

const likePostParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': 'ID must be a valid ObjectId',
      'any.required': 'ID is required',
    }),
});

const removePostParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': 'ID must be a valid ObjectId',
      'any.required': 'ID is required',
    }),
});

module.exports = {
  fetchPosts: {
    query: fetchPostsQuery,
  },
  createPost: {
    body: createPostBody,
  },
  likePost: {
    params: likePostParams,
  },
  removePost: {
    params: removePostParams,
  },
};
