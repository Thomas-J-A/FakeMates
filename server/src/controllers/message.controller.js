exports.fetchMessages = async (req, res, next) => {
  try {

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
