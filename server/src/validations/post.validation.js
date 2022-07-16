const Joi = require('joi');

const objectId = /^[0-9a-fA-F]{24}$/;

const fetchPostsQuery = Joi.object({
  userid: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': 'userid must be a valid ObjectId',
      'any.required': 'userid is required',
    }),
});

const createPostBody = Joi.object({
  content: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.max': 'Content must be less than 100 characters',
      'any.required': 'Content is required',
    }),
});

const likePostParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': ':id must be a valid ObjectId',
      'any.required': ':id is required',
    }),
});

const removePostParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': ':id must be a valid ObjectId',
      'any.required': ':id is required',
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
