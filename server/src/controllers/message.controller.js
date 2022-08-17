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

    // Create a new message
    const message = new req.models.Message({
      sender: req.user._id,
      conversationId,
      content,
      readBy: [req.user._id],
    });

    await message.save();

    return res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

exports.markMessageAsRead = async (req, res, next) => {
  try {

  } catch (err) {
    next(err);
  }
};
