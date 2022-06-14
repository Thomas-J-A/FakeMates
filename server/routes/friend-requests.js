const express = require('express');
const friendRequestsController = require('../controllers/friendRequestsController');

const router = express.Router();

router.get('/', friendRequestsController.fetchFriendRequests);
router.post('/', friendRequestsController.sendFriendRequest);
router.put('/:id', friendRequestsController.handleFriendRequest);

module.exports = router;
