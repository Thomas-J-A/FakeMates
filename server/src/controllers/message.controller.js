exports.fetchMessages = async (req, res, next) => {
  try {
    const { conversationId, page } = req.query;

    // Verify that conversation exists
    const conversation = await req.models.Conversation.findById(conversationId).exec();

    if (!conversation) {
      return res.status(400).json({ message: 'Conversation doesn\'t exist' });
    }

    // Verify that current user is part of conversation
    if (!conversation.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this conversation to fetch its messages' });
    }

    // Fetch paginated messages for this conversation
    const limit = 20;
    const skip = (page - 1) * limit;

    const messages = await req.models.Message.find()
      .and([
        { conversationId },
        { deletedBy: { $nin: [req.user._id] } },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Populate sender details if its a group conversation
    if (conversation.type === 'group') {
      const promises = messages.map(async (m) => {
        await m.populate({
          path: 'sender',
          // match: { _id: { $ne: req.user._id }}, // Not necessary to populate current user
          select: 'fullName avatarUrl',
        });
      });

      await Promise.all(promises);
    }

    // Check if there are more results
    const endIndex = page * limit;
    const totalCount = await req.models.Message.countDocuments()
      .and([
        { conversationId },
        { deletedBy: { $nin: [req.user._id] } },
      ])
      .exec();
    const hasMore = endIndex < totalCount;

    return res.status(200).json({
      messages,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content } = req.body;

    // Verify that conversation exists
    const conversation = await req.models.Conversation.findById(conversationId).exec();

    if (!conversation) {
      return res.status(400).json({ message: 'Conversation doesn\'t exist' });
    }

    // Verify that current user is part of conversation
    if (!conversation.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this conversation to send a message' });
    }

    // Remove any user ids from deletedBy array so members who deleted the chat
    // but remain a part of the conversation will be able to view new messages
    if (conversation.deletedBy.length > 0) {
      conversation.deletedBy = [];

      await conversation.save();
    }

    // Create a new message
    const message = new req.models.Message({
      sender: req.user._id,
      conversationId,
      content,
      readBy: [req.user._id],
    });

    await message.save();
    
    // TODO: emit a socket.io event containing this message

    return res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { type, conversationId } = req.body;

    // Verify that conversation exists
    const conversation = await req.models.Conversation.findById(conversationId).exec();

    if (!conversation) {
      return res.status(400).json({ message: 'Conversation doesn\'t exist' });
    }

    // Verify that current user is a member of this conversation
    if (!conversation.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'You must be a member of this conversation to update its messages' });
    }

    // Mark all unread messages as read for current user
    const unreadMessages = await req.models.Message.find()
      .and([
        { conversationId },
        { readBy: { $nin: [req.user._id] } },
      ])
      .exec();

    const promises = unreadMessages.map(async (m) => {
      m.readBy.push(req.user._id);

      await m.save();
    });

    await Promise.all(promises);

    // No need to return a representation of all messages since they'll be
    // available on the client anyway, except with an old readBy value;
    // it just becomes unnecessary data in the response
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};








// Mark messages as read individually, rather than batch update them at once

// exports.markMessageAsRead = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     // Verify that message exists
//     const message = await req.models.Message.findById(id).exec();

//     if (!message) {
//       return res.status(400).json({ message: 'Message doesn\'t exist' });
//     }

//     // Verify that current user is a member of the
//     // conversation that message belongs to
//     const conversation = await req.models.Conversation.findById(message.conversationId).exec();

//     if (!conversation.members.includes(req.user._id)) {
//       return res.status(403).json({ message: 'You must be a member of this conversation to update this message' });
//     }

//     // Verify that user hasn't already marked message as deleted
//     if (message.deletedBy.includes(req.user._id)) {
//       return res.status(403).json({ message: 'You have already deleted this message' });
//     }

//     // Verify that user hasn't already marked message as read
//     if (message.readBy.includes(req.user._id)) {
//       return res.status(403).json({ message: 'You have already read this message' })
//     }

//     // Mark message as read
//     message.readBy.push(req.user._id);

//     await message.save();

//     return res.status(200).json(message);
//   } catch (err) {
//     next(err);
//   }
// };
