const Joi = require('joi');

const objectId = /^[0-9a-fA-F]{24}$/;

const fetchCommentsQuery = Joi.object({
  postid: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.empty': 'Post ID must not be empty',
      'string.pattern.base': 'Post ID must be a valid ObjectId',
      'any.required': 'Post ID is required',
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

const createCommentQuery = Joi.object({
  postid: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.empty': 'Post ID must not be empty',
      'string.pattern.base': 'Post ID must be a valid ObjectId',
      'any.required': 'Post ID is required',
    }),
});

const createCommentBody = Joi.object({
  content: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Content must not be empty',
      'string.max': 'Content must be less than 100 characters', 
      'any.required': 'Content is required',
    }),
});

const likeCommentParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': 'ID must be a valid ObjectId',
      'any.required': 'ID is required',
    }),
});

module.exports = {
  fetchComments: {
    query: fetchCommentsQuery,
  },
  createComment: {
    query: createCommentQuery,
    body: createCommentBody,
  },
  likeComment: {
    params: likeCommentParams,
  },
};
