const Joi = require('joi');

const objectId = /^[0-9a-fA-F]{24}$/;

const fetchNotificationsQuery = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an interger',
      'number.min': 'Page must be greater than or equal to one',
      'any.required': 'Page is required',
    }),
});

const handleNotificationParams = Joi.object({
  id: Joi.string()
    .regex(objectId)
    .required()
    .messages({
      'string.pattern.base': 'ID must be a valid ObjectId',
      'any.required': 'ID is required',
    }),
});

const handleNotificationQuery = Joi.object({
  action: Joi.string()
    .valid('read', 'delete')
    .required()
    .messages({
      'any.only': 'Action must be either \'read\' or \'delete\'',
      'any.required': 'Action is required',
    }),
});

module.exports = {
  fetchNotifications: {
    query: fetchNotificationsQuery,
  },
  handleNotification: {
    params: handleNotificationParams,
    query: handleNotificationQuery,
  },
};
