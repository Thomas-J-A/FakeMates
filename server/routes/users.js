const express = require('express');
const usersController = require('../controllers/usersController');

const router = express.Router();

router.get('/:id', usersController.fetchUserInfo);
router.put('/:id', usersController.updateUserInfo);
router.delete('/:id', usersController.deleteAccount);

module.exports = router;
