exports.fetchUserInfo = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify that user exists
    const user = await req.models.User.findById(id)
      .populate('friends', 'firstName lastName avatarUrl friends')
      .exec();

    if(!user) {
      return res.status(400).json({ message: 'User doesn\'t exist' });
    }

    // Remove unnecessary/vulnerable fields from user data
    const { email, password, ...rest } = user._doc;

    return res.status(200).json(rest);
  } catch (err) {
    next(err);
  }
};

exports.updateUserInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.query;
    
    // Verify that user with 'id' exists
    const user = await req.models.User.findById(id).exec();
    
    if (!user) {
      return res.status(400).json({ message: 'User doesn\'t exist' });
    }
    
    // Verify that 'id' belongs to current user
    if (id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You may only update your own profile' });
    }

    switch (action) {
      case 'edit':
        // Verify that the user has sent new data
        if (Object.keys(req.body).length === 0) {
          return res.status(400).json({ message: 'You must supply some data to update profile' });
        }
        
        // Update only fields that user has populated in update form
        for (const key in req.body) {
          user[key] = req.body[key];
        }

        break;
      case 'unfriend':
        const { friendid } = req.query;

        // Verify that user with 'friendid' exists
        const friend = await req.models.User.findById(friendid).exec();

        if (!friend) {
          return res.status(400).json({ message: 'Friend doesn\'t exist' });
        }

        // Verify that current user is friends with this 'friend'
        if (!user.friends.includes(friend._id)) {
          return res.status(403).json({ message: 'You are not friends with this user' });
        }

        // Remove from eachother's friends list
        user.friends = user.friends.filter((f) => !f._id.equals(friend._id)); // Comparing ObjectIds not primitive strings

        friend.friends = friend.friends.filter((f) => !f._id.equals(user._id)); // Comparing ObjectIds not primitive strings
        await friend.save();

        // Remove friend request
        await req.models.FriendRequest.findOneAndDelete({
          $or: [
            { from: user._id, to: friend._id },
            { from: friend._id, to: user._id },
          ],
        }).exec();

        break;
      case 'logout':
        // Single responsibility - PUT request just to update user record; 
        // also call /api/auth/logout in a second fetch request from client
        user.isOnline = false;
        user.lastOnline = new Date();
        break;
    }

    await user.save();

    return res.status(200).json(user);
  } catch (err) {
    next(er);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify that user exists
    const user = await req.models.User.findById(id).exec();

    if(!user) {
      return res.status(400).json({ message: 'User doesn\'t exist' });
    }

    // Verify that 'id' belongs to current user
    if (id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You may only delete your own record' });
    }

    // Delete current user
    await user.remove();

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
