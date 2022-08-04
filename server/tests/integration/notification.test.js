const supertest = require('supertest');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const app = require('../../src/app');
const dbUtil = require('../utils/db.util');
const createAuthedUser = require('../utils/createAuthedUser.util');
const models = require('../../src/models/index.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

const fakeUserId = new mongoose.Types.ObjectId().toString();
const anotherFakeUserId = new mongoose.Types.ObjectId().toString();
const fakePostId = new mongoose.Types.ObjectId().toString();
const fakeNotificationId = new mongoose.Types.ObjectId().toString();

describe('GET /api/notifications', () => {
  const currentUser = createAuthedUser();

  it('should paginate results and let client know if there are more', async () => {
    // Seed enough notifications for two pages
    for (let i = 0; i < 12; i++) {
      const notification = new models.Notification({
        actor: fakeUserId,
        recipients: [currentUser.data._id],
        actionType: 1,
        actionSource: fakePostId,
      });

      await notification.save();
    }

    // Fetch page one
    const res = await api
      .get('/api/notifications')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(10);
    expect(res.body.hasMore).toBeTruthy();

    // Fetch page two
    const res2 = await api
      .get('/api/notifications')
      .query({ page: 2 })
      .set('Cookie', currentUser.cookie);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.notifications).toHaveLength(2);
    expect(res2.body.hasMore).toBeFalsy();
  });


  it('should return latest notifications first', async () => {
    // Seed notifications
    for (let i = 0; i < 2; i++) {
      const notification = new models.Notification({
        actor: fakeUserId,
        recipients: [currentUser.data._id],
        actionType: 1,
        actionSource: fakePostId,
      });

      await notification.save();
    }

    // Fetch notifications
    const res = await api
      .get('/api/notifications')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    // Parse the ISO formatted createdAt value into a UNIX timestamp
    const timestamp1 = Date.parse(res.body.notifications[0].createdAt);
    const timestamp2 = Date.parse(res.body.notifications[1].createdAt);

    expect(res.statusCode).toBe(200);
    expect(timestamp1).toBeGreaterThan(timestamp2);
  });


  it('should return valid response if no notifications available', async () => {
    const res = await api
      .get('/api/notifications')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should return both read and unread notifications', async () => {
    // Seed notifications (read and unread)
    for (let i = 0; i < 2; i++) {
      const notification = new models.Notification({
        actor: fakeUserId,
        recipients: [currentUser.data._id],
        actionType: 1,
        actionSource: fakePostId,
        readBy: (i % 2 === 0) ? [currentUser.data._id] : [], // Alternate between read/unread
      });

      await notification.save();
    }

    // Fetch notifications
    const res = await api
      .get('/api/notifications')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);

    // Verify that there are read notifications in response
    const hasRead = res.body.notifications.some((n) => {
      return n.readBy.includes(currentUser.data._id.toString());
    });

    // Verify that there are unread notifications in response
    const hasUnread = res.body.notifications.some((n) => {
      return n.readBy.indexOf(currentUser.data._id.toString()) === -1;
    });

    expect(hasRead).toBeTruthy();
    expect(hasUnread).toBeTruthy();
  });


  it('should not return notifications which user has \'deleted\'', async () => {
    // Seed a deleted notification
    const deletedNotification = new models.Notification({
      actor: fakeUserId,
      recipients: [currentUser.data._id],
      actionType: 1,
      actionSource: fakePostId,
      readBy: [currentUser.data._id],
      deletedBy: [currentUser.data._id],
    });

    await deletedNotification.save();

    // Fetch notifications
    const res = await api
      .get('/api/notifications')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(0);

    // Verify that there are no deleted notifications in response
    // const hasDeleted = res.body.notifications.some((n) => {
    //   return n.deletedBy.includes(currentUser.data._id.toString());
    // });

    // expect(hasDeleted).toBeFalsy();
  });


  it('should populate some details about user who performed the activity', async () => {
    // Seed a second user
    const actor = new models.User({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    });

    await actor.save();

    // Seed a notification
    const notification = new models.Notification({
      actor: actor._id,
      recipients: [currentUser.data._id],
      actionType: 1,
      actionSource: fakePostId,
    });

    await notification.save();

    // Fetch notifications
    const res = await api
      .get('/api/notifications')
      .query({ page: 1 })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications[0].actor).toHaveProperty('fullName');
    expect(res.body.notifications[0].actor).toHaveProperty('avatarUrl');
    expect(res.body.notifications[0].actor).not.toHaveProperty('email');
    expect(res.body.notifications[0].actor).not.toHaveProperty('location');
  });


  it('should return 400 if \'page\' is missing', async () => {
    const res = await api
      .get('/api/notifications')
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page is required');
  });


  it('should return 400 if \'page\' is a negative number', async () => {
    const page = -1;

    const res = await api
      .get('/api/notifications')
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if \'page\' is zero', async () => {
    const page = 0;

    const res = await api
      .get('/api/notifications')
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if \'page\' is a floating point number', async () => {
    const page = 4.2;

    const res = await api
      .get('/api/notifications')
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be an interger');
  });


  it('should return 400 if \'page\' is not a number', async () => {
    const page = faker.lorem.word();

    const res = await api
      .get('/api/notifications')
      .query({ page })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be a number');
  })
});

describe('PUT /api/notifications/:id', () => {
  const currentUser = createAuthedUser();

  it('should mark notification as read', async () => {
    // Seed a notification
    const notification = new models.Notification({
      actor: anotherFakeUserId,
      recipients: [currentUser.data._id, fakeUserId],
      actionType: 1,
      actionSource: fakePostId,
    });

    await notification.save();

    // Fetch notifications
    const res = await api
      .put(`/api/notifications/${ notification._id }`)
      .query({ action: 'read' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.readBy).toContain(currentUser.data._id.toString());
  });


  it('should mark notification as deleted', async () => {
    // Seed a notification
    const notification = new models.Notification({
      actor: anotherFakeUserId,
      recipients: [currentUser.data._id, fakeUserId],
      actionType: 1,
      actionSource: fakePostId,
    });

    await notification.save();

    const res = await api
      .put(`/api/notifications/${ notification._id }`)
      .query({ action: 'delete' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.deletedBy).toContain(currentUser.data._id.toString());
  });


  it('should remove notification if all recipients have deleted it', async () => {
    // Seed a notification with one of two recipients already in deletedBy array
    const notification = new models.Notification({
      actor: anotherFakeUserId,
      recipients: [currentUser.data._id, fakeUserId],
      actionType: 1,
      actionSource: fakePostId,
      readBy: [fakeUserId],
      deletedBy: [fakeUserId],
    });

    await notification.save();

    // Mark notification as deleted for current user
    await api
      .put(`/api/notifications/${ notification._id }`)
      .query({ action: 'delete' })
      .set('Cookie', currentUser.cookie);

    // Verify that notification has been removed from database
    const notificationDoc = await models.Notification.findById(notification._id).exec();
    
    expect(notificationDoc).toBeNull();
  });


  it('should return 400 if \':id\' is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .put(`/api/notifications/${ invalidId }`)
      .query({ action: 'read' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('ID must be a valid ObjectId');
  });


  it('should return 400 if notification doesn\'t exist', async () => {
    const res = await api
      .put(`/api/notifications/${ fakeNotificationId }`)
      .query({ action: 'read' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Notification doesn\'t exist');
  });


  it('should return 403 if user is not a recipient of notification', async () => {
    // Seed a notification
    const notification = new models.Notification({
      actor: anotherFakeUserId,
      recipients: [fakeUserId],
      actionType: 1,
      actionSource: fakePostId,
    });

    await notification.save();
    
    // Fetch notifications
    const res = await api
      .put(`/api/notifications/${ notification._id }`)
      .query({ action: 'read' })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You are not authorised to update this notification');
  });


  it('should return 400 if \'action\' is missing', async () => {
    const res = await api
      .put(`/api/notifications/${ fakeNotificationId }`)
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Action is required');
  });


  it('should return 400 if \'action\' is neither \'read\' nor \'deleted\'', async () => {
    const invalidAction = faker.word.verb();

    const res = await api
      .put(`/api/notifications/${ fakeNotificationId }`)
      .query({ action: invalidAction })
      .set('Cookie', currentUser.cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Action must be either \'read\' or \'delete\'');
  });
});
