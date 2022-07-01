const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.get('/:id', userController.fetchUserInfo);
router.put('/:id', userController.updateUserInfo);
router.delete('/:id', userController.deleteAccount);

module.exports = router;
