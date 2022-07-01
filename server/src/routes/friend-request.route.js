const express = require('express');
const friendRequestController = require('../controllers/friend-request.controller');

const router = express.Router();

router.get('/', friendRequestController.fetchFriendRequests);
router.post('/', friendRequestController.sendFriendRequest);
router.put('/:id', friendRequestController.handleFriendRequest);

module.exports = router;
