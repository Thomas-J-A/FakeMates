const supertest = require('supertest');
const { faker } = require('@faker-js/faker');

const app = require('../../../src/app');
const dbUtil = require('../../utils/db.util');
const data = require('../data/index.data');
const models = require('../../../src/models/index.model');

const api = supertest(app);

beforeAll(async () => await dbUtil.setupDatabase());

afterEach(async () => await dbUtil.clearDatabase());

afterAll(async () => await dbUtil.closeDatabase());

// Used for actionSource in request
const fakeId = '62c7cb5fc583794ebd47f3ab';

describe('GET /api/notifications', () => {
  let users = [];
  
  // Seed database
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 2; i++) {
      const _user = new models.User(data.users[i]);
      await _user.save();

      users.push({ data: _user });
    }

    // Seed notifications (read and unread)
    for (let i = 0; i < 12; i++) {
      const _notification = new models.Notification({
        actor: users[1].data._id,
        recipients: [users[0].data._id],
        actionType: 1,
        actionSource: fakeId,
        readBy: (i % 2 === 0) ? [users[0].data._id] : [], // Alternate between read/unread
      });

      await _notification.save();
    }
  });

  // Authenticate users
  beforeEach(async () => {
    for (let i = 0; i < 2; i++) {
      const userInfo = {
        email: data.users[i].email,
        password: data.users[i].password,
      };

      const res = await api
        .post('/api/auth/email')
        .send(userInfo);

      users[i].cookie = res.headers['set-cookie'][0];
    }
  });

  // Clear array after each test
  afterEach(() => users = []);

  it('should fetch page one of user\'s notifications', async () => {
    const res = await api
      .get('/api/notifications')
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(10);
    expect(res.body.hasMore).toBeTruthy();
  });


  it('should fetch page two of user\'s notifications', async () => {
    const res = await api
      .get('/api/notifications')
      .query({ page: 2 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(2);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should return latest notifications first', async () => {
    const res = await api
      .get('/api/notifications')
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

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
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(0);
    expect(res.body.hasMore).toBeFalsy();
  });


  it('should return both read and unread notifications', async () => {
    const res = await api
      .get('/api/notifications')
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);

    const hasRead = res.body.notifications.some((n) => {
      return n.readBy.includes(users[0].data._id.toString());
    });

    const hasUnread = res.body.notifications.some((n) => {
      return n.readBy.indexOf(users[0].data._id.toString()) === -1;
    });

    expect(hasRead).toBeTruthy();
    expect(hasUnread).toBeTruthy();
  });


  it('should not return notifications which user has \'deleted\'', async () => {
    // Seed notifications (deleted)
    for (let i = 0; i < 2; i++) {
      const notification = new models.Notification({
        actor: users[1].data._id,
        recipients: [users[0].data._id],
        actionType: 1,
        actionSource: fakeId,
        readBy: [users[0].data._id],
        deletedBy: [users[0].data._id],
      });

      await notification.save();
    }

    const res = await api
      .get('/api/notifications')
      .query({ page: 2 }) // First 12 docs haven't been deleted
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications.length).toBe(2);
    
    const hasDeleted = res.body.notifications.some((n) => {
      return n.deletedBy.includes(users[0].data._id.toString());
    });

    expect(hasDeleted).toBeFalsy();
  });


  it('should populate some details about user who performed the activity', async () => {
    const res = await api
      .get('/api/notifications')
      .query({ page: 1 })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications[0].actor).toHaveProperty('firstName');
    expect(res.body.notifications[0].actor).toHaveProperty('lastName');
    expect(res.body.notifications[0].actor).toHaveProperty('avatarUrl');
    expect(res.body.notifications[0].actor).not.toHaveProperty('email');
    expect(res.body.notifications[0].actor).not.toHaveProperty('location');
  });


  it('should return 400 if page query parameter is missing', async () => {
    const res = await api
      .get('/api/notifications')
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page is required');
  });


  it('should return 400 if page is a negative number', async () => {
    const page = -1;

    const res = await api
      .get('/api/notifications')
      .query({ page })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if page is zero', async () => {
    const page = 0;

    const res = await api
      .get('/api/notifications')
      .query({ page })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be greater than or equal to one');
  });


  it('should return 400 if page is a floating point number', async () => {
    const page = 4.2;

    const res = await api
      .get('/api/notifications')
      .query({ page })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Page must be an interger');
  });  
});

describe('PUT /api/notifications/:id', () => {
  let users = [];
  let notification;

  // Seed database
  beforeEach(async () => {
    // Seed users
    for (let i = 0; i < 4; i++) {
      const _user = new models.User(data.users[i]);
      await _user.save();

      users.push({ data: _user });
    }

    // Seed a notification
    const _notification = new models.Notification({
      actor: users[0].data._id,
      recipients: [users[1].data._id, users[2].data._id],
      actionType: 1,
      actionSource: fakeId,
    });

    await _notification.save();

    notification = _notification;
  });

  // Authenticate users
  beforeEach(async () => {  
    for (let i = 0; i < 4; i++) {
      const userInfo = {
        email: data.users[i].email,
        password: data.users[i].password,
      };
      
      const res = await api
      .post('/api/auth/email')
      .send(userInfo);
      
      users[i].cookie = res.headers['set-cookie'][0];
    }
  });

  // Clear array after each test
  afterEach(() => users = []);

  it('should mark notification as read', async () => {
    const res = await api
      .put(`/api/notifications/${ notification._id }`)
      .query({ action: 'read' })
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.readBy).toContain(users[1].data._id.toString());
  });


  it('should mark notification as deleted', async () => {
    const res = await api
      .put(`/api/notifications/${ notification._id }`)
      .query({ action: 'delete' })
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.deletedBy).toContain(users[1].data._id.toString());
  });


  it('should remove notification if all recipients have deleted it', async () => {
    await api
      .put(`/api/notifications/${ notification._id }`)
      .query({ action: 'delete' })
      .set('Cookie', users[1].cookie);

    await api
      .put(`/api/notifications/${ notification._id }`)
      .query({ action: 'delete' })
      .set('Cookie', users[2].cookie);

    // Verify that notification has been removed from database
    const returnedNotification = await models.Notification.findById(notification._id).exec();
    
    expect(returnedNotification).toBeNull();
  });


  it('should return 400 if :id param is invalid', async () => {
    const invalidId = 'abc123';

    const res = await api
      .put(`/api/notifications/${ invalidId }`)
      .query({ action: 'read' })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(':id must be a valid ObjectId');
  });


  it('should return 400 if notification doesn\'t exist', async () => {
    const fakeId = '62c7cb5fc583794ebd47f3ab';

    const res = await api
      .put(`/api/notifications/${ fakeId }`)
      .query({ action: 'read' })
      .set('Cookie', users[0].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Notification doesn\'t exist');
  });


  it('should return 403 if user is not a recipient of notification', async () => {
    const res = await api
      .put(`/api/notifications/${ notification._id }`)
      .query({ action: 'read' })
      .set('Cookie', users[3].cookie);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('You are not authorised to update this notification');
  });


  it('should return 400 if action query parameter is missing', async () => {
    const res = await api
      .put(`/api/notifications/${ notification._id }`)
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('action is required');
  });


  it('should return 400 if action is neither \'read\' or \'deleted\'', async () => {
    const invalidAction = faker.word.verb();

    const res = await api
      .put(`/api/notifications/${ notification._id }`)
      .query({ action: invalidAction })
      .set('Cookie', users[1].cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('action must be either \'read\' or \'delete\'');
  });
});
