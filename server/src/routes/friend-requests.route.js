const express = require('express');
const friendRequestsController = require('../controllers/friend-requests.controller');

const router = express.Router();

router.get('/', friendRequestsController.fetchFriendRequests);
router.post('/', friendRequestsController.sendFriendRequest);
router.put('/:id', friendRequestsController.handleFriendRequest);

module.exports = router;
