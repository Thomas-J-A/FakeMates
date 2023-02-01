exports.fetchFriendRequests = async (req, res, next) => {
  try {
    // Fetch all pending friend requests for current user
    const friendRequests = await req.models.FriendRequest.find({ to: req.user._id, status: 1 })
      .populate('from', 'firstName fullName avatarUrl')
      .exec();

    return res.status(200).json(friendRequests);
  } catch (err) {
    next(err);
  }
};

exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { to } = req.query;
  
    // Verify that the user hasn't sent a friend request to themselves
    if (to === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot send a friend request to yourself' });
    }

    // Verify that the recipient exists
    const user = await req.models.User.findById(to).exec();

    if (!user) {
      return res.status(400).json({ message: 'User doesn\'t exist' });
    }

    // Verify that you don't already have a pending/accepted/rejected friend request
    // There can only be one FriendRequest instance per pair of users, therefore
    // you must check with both as a requester/recipient
    const existingFriendRequest = await req.models.FriendRequest.findOne({
      $or: [
        { from: req.user._id, to },
        { from: to, to: req.user._id },
      ],
    }).exec();

    if (existingFriendRequest) {
      switch (existingFriendRequest.status) {
        case 1:
          return res.status(403).json({ message: 'A friend request is already pending' });
        case 2:
          return res.status(403).json({ message: 'You are already friends with this user' });
        case 3:
          return res.status(403).json({ message: 'This friendship has already been rejected' });
      }
    }

    // Create a new friend request
    const friendRequest = new req.models.FriendRequest({
      from: req.user._id,
      to
    });

    await friendRequest.save();

    return res.status(201).json(friendRequest);
  } catch (err) {
    next(err);
  }
};

exports.handleFriendRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { accept } = req.query;
    
    const friendRequest = await req.models.FriendRequest.findById(id).exec();
    
    // Verify that a friend request exists
    if (!friendRequest) {
      return res.status(400).json({ message: 'Friend request doesn\'t exist' });
    }

    // Verify that current user is the recipient of the request
    if (!friendRequest.to.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the recipient can handle this friend request' });
    }
    
    if (accept) {
      // Update friend request status
      friendRequest.status = 2;
      await friendRequest.save();
      
      // Update both friends lists
      const from = await req.models.User.findById(friendRequest.from).exec();

      from.friends.push(req.user._id);
      await from.save();
      
      req.user.friends.push(from._id);
      await req.user.save();
      
      return res.status(200).json(req.user);
    } else {
      // Update friend request status
      friendRequest.status = 3;
      await friendRequest.save();

      return res.sendStatus(204);
    }
  } catch (err) {
    next(err);
  }
};
