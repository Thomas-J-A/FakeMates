const Joi = require('joi');

const objectId = /^[0-9a-fA-F]{24}$/;

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

const createNewChatQuery = Joi.object({
  type: Joi.string()
    .valid('private', 'group')
    .required()
    .messages({
      'any.only': 'Type must be either \'private\' or \'group\'',
      'any.required': 'Type is required',
    }),
});

// const createNewChatBody = Joi.object({
//   memberIds: Joi.array()
//     .items(
//       Joi.string()
//         .regex(objectId)
//         .required()
//     )
//     .min(1)
//     .max(8)
//     .required()
//     .messages({
//       'array.includesRequiredUnknowns': 'Member IDs list must contain at least one valid ObjectId', // Array items are not of type ObjectID
//       'array.max': 'Member IDs list must contain eight or fewer IDs', // Too many members
//       'array.base': 'Member IDs list must be an array', // MemberIds value isn't an array
//       'any.required': 'Member IDs list is required', // memberIds field is missing
//     }),

//   // if type === group, additionally validate group name
//   name: Joi.when('type', {
//     is: 'group',
//     then: Joi.string()
//       .max(20)
//       .required()
//       .messages({
//         'string.empty': 'Name must not be empty',
//         'string.max': 'Name must be twenty characters or less',
//         'any.required': 'Name is required',
//       }),
//   }),
// });

const createNewChatBody = Joi.when('$type', {
  is: 'private',
  then: Joi.object({
    memberId: Joi.string()
      .regex(objectId)
      .required()
      .messages({
        'string.empty': 'Member ID must not be empty',
        'string.pattern.base': 'Member ID must be a valid ObjectId',
        'any.required': 'Member ID is required',
      }),
  }),
  otherwise: Joi.object({
    name: Joi.string()
      .max(20)
      .required()
      .messages({
        'string.empty': 'Name must not be empty',
        'string.max': 'Name must be twenty characters or less',
        'any.required': 'Name is required',
      }),
    memberIds: Joi.array()
      .items(
        Joi.string()
          .regex(objectId)
          .required()
      )
      .max(8)
      .required()
      .messages({
        'string.empty': 'Member IDs list must not contain empty strings',
        'string.pattern.base': 'Member IDs list must contain only valid ObjectIds',
        'array.max': 'Member IDs list must contain eight or fewer IDs',
        'array.base': 'Member IDs list must be an array',
        'any.required': 'Member IDs list is required',
      }),
  }),
});

module.exports = {
  fetchChats: {
    query: fetchChatsQuery,
  },
  createNewChat: {
    query: createNewChatQuery,
    body: createNewChatBody,
  },
};
