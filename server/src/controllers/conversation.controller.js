exports.fetchChats = async (req, res, next) => {
  try {
    const { type, page } = req.query;

    // Fetch paginated conversations
    // Include unread messages count and last message for each conversation
    const limit = 10;
    const skip = (page - 1) * limit;

    const conversations = await req.models.Conversation.aggregate()
      .match({
        $and: [
          { type },
          { members: { $in: [req.user._id] } },
          { deletedBy : { $nin: [req.user._id] } },
        ]
      })
      .lookup({
        from: 'messages',
        localField: '_id',
        foreignField: 'conversationId',
        as: 'messages',
      })
      .unwind('messages')
      .sort({ 'messages.createdAt': -1 })
      .group({
        _id: '$_id',
        data: { $first: '$$ROOT' },
        lastMessage: { $first: '$messages' },
        unreadCount: {
          $sum: {
            $cond: [{ $in: [req.user._id, { $ifNull: ['$messages.readBy', []] }] }, 0, 1]
          }
        },
      })
      // $group doesn't output docs in any partdicular order, so re-order
      // by latest message again to have convo with latest activity at top of list
      .sort({ 'lastMessage.createdAt': -1 })
      .skip(skip)
      .limit(limit)
      .lookup({ // Populate members array (to display full name and avatar of other members in chat)
        from: 'users',
        let: {
          members: '$data.members',
          currentUserId: req.user._id,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ['$_id', '$$members']},
                  { $ne: ['$_id', '$$currentUserId']},
                ]
              }
            }
          },
          { $project: { fullName: 1, avatarUrl: 1 } },
        ],
        as: 'data.members',
      })
      .lookup({ // Populate last message sender (to display full name of whoever wrote last message in a group chat)
        from: 'users',
        let: {
          sender: '$lastMessage.sender',
        },
        pipeline: [
          {
            $match: {
              $expr: { 
                $eq: ['$_id', '$$sender']
              }
            }
          },
          { $project: { fullName: 1 } },
        ],
        as: 'lastMessage.sender',
      })
      .unwind('lastMessage.sender') // $lookup returns an array of one object, so flatten it
      .project({
        _id: 0, // Duplicated
        'data.messages': 0, // Duplicated
      })
      .exec();

    // Check if there are more results
    const endIndex = page * limit;
    const totalCount = await req.models.Conversation.countDocuments()
      .and([
        { type },
        { members: { $in: [req.user._id] } }, 
        { deletedBy : { $nin: [req.user._id] } },
      ])
      .exec();

    const hasMore = endIndex < totalCount;

    return res.status(200).json({
      conversations,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
};

exports.createNewChat = async (req, res, next) => {
  try {
    const { type } = req.query;
    
    if (type === 'private') {
      const { memberId } = req.body;

      // Verify that a user with memberId exists
      const user = await req.models.User.findById(memberId).exec();

      if(!user) {
        return res.status(400).json({ message: 'User doesn\'t exist' });
      }

      // Check if conversation already exists
      const conversation = await req.models.Conversation.findOne()
        .and([
          { type },
          { members: { $all: [memberId, req.user._id] } },
        ])
        .exec();

      if (conversation) {
        if (conversation.deletedBy.includes(req.user._id)) {
          // Current user previously deleted chat - continue chat with same document
          // Remove user from conversation.deletedBy
          conversation.deletedBy = conversation.deletedBy.filter((member) => member._id !== req.user._id);
          await conversation.save();

          // Conversation ID needed clientside to associate this chat with all later messages
          // Original conversation doc is used so that the user who didn't delete chat can
          // continue to receive all old messages plus new ones sent after this request in same chat thread
          return res.status(200).json(conversation);
        }
        
        // Chat already ongoing
        return res.status(403).json({ message: 'Conversation already exists' });
      }   

      // Create a new conversation
      const newConversation = new req.models.Conversation({
        type: 'private',
        members: [memberId, req.user._id],
      });

      await newConversation.save();

      return res.status(201).json(newConversation);
    }

    // Group chat
    const { name, memberIds } = req.body;

    // Verify that all other members of conversation exist
    // Array.prototype.every doesn't work with async/await
    const promises = memberIds.map(async (id) => {
      return await req.models.User.findById(id).exec();
    });

    const users = await Promise.all(promises);

    if (users.includes(null)) {
      return res.status(400).json({ message: 'At least one of the users doesn\'t exist' });
    }

    // Create a new conversation
    const newConversation = new req.models.Conversation({
      name,
      type,
      createdBy: req.user._id,
      members: [...memberIds, req.user._id],
    });

    // Add avatarUrl to doc if user uploaded
    // an (optional) group avatar
    if (req.file) {
      newConversation.avatarUrl = req.file.path;
    }

    await newConversation.save();

    return res.status(201).json(newConversation);
  } catch (err) {
    next(err);
  }
};

exports.updateChat = (req, res) => {
  res.send('Updated chat');
};

exports.deleteGroup = (req, res) => {
  res.send('Deleted chat');
};












    // // Fetch conversations
    // let conversations = await req.models.Conversation.find()
    // .and([
    //   { type },
    //   { members: { $in: [req.user._id] }}, 
    //   { deletedBy : { $nin: [req.user._id] }},
    // ])
    // // .sort({ 'lastMessage.createdAt': -1 })
    // .populate({
    //   path: 'members',
    //   match: { _id: { $ne: req.user._id }}, // Not necessary to populate current user
    //   select: 'fullName avatarUrl'
    // })
    // .skip(skip)
    // .limit(limit)
    // .exec();



    // from: 'users',
    // localField: 'conversation.members',
    // foreignField: '_id',
    // as: 'conversation.members',



    // const index = conversation.deletedBy.indexOf(req.user._id);
    // conversation.deletedBy.splice(index, 1);