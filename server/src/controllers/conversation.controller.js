// TODO: refactor these controller functions by adding for example
// pre('remove') hooks in model files and moving logic there, or
// simply breaking off into smaller functions

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
      // $group doesn't output docs in any particular order, so re-order
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

      if (!user) {
        return res.status(400).json({ message: 'User doesn\'t exist' });
      }

      // Verify that user is friends with current user
      if (!req.user.friends.includes(memberId)) {
        return res.status(403).json({ message: 'You may only chat with friends' });
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
          conversation.deletedBy = conversation.deletedBy.filter((id) => !(id.equals(req.user._id))); // Comparing ObjectIds
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

    // Verify that current user is friends with all other members
    users.forEach((u) => {
      if (!req.user.friends.includes(u._id)) {
        return res.status(403).json({ message: 'You may only chat with friends' });
      }
    })

    // Create a new conversation
    const newConversation = new req.models.Conversation({
      name,
      type,
      admin: req.user._id,
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

exports.updateChat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.query;

    // Verify that conversation exists
    const conversation = await req.models.Conversation.findById(id).exec();
    
    if (!conversation) {
      return res.status(400).json({ message: 'Conversation doesn\'t exist' });
    }

    // Verify that current user is part of this conversation
    if (!(conversation.members.includes(req.user._id))) {
      return res.status(403).json({ message: 'You must be a member of this conversation to update record' });
    }

    let isDeletedAll = false;

    if (action === 'delete-chat') {
      // Verify that current user hasn't already 'deleted' this conversation
      if (conversation.deletedBy.includes(req.user._id)) {
        return res.status(403).json({ message: 'You have already deleted this conversation' });
      }

      // Mark conversation as 'deleted' for current user
      conversation.deletedBy.push(req.user._id);

      // Check if all members have now deleted this conversation
      isDeletedAll = conversation.members.every((member) => conversation.deletedBy.includes(member));
    } else {
      // Leave group        
      // Remove current user from the list of conversation members
      conversation.members = conversation.members.filter((id) => !id.equals(req.user._id));

      // Check if all members have now deleted this conversation
      isDeletedAll = conversation.members.every((member) => conversation.deletedBy.includes(member));

      if (!isDeletedAll) {
        // Let other members know that a member has left the group
        let messageContent = `${ req.user.fullName } has left the group.`;

        // If user is admin of group, randomly assign a new admin from members
        if (conversation.admin.equals(req.user._id)) {
          conversation.admin = conversation.members > 1
            ? conversation.members[Math.floor(Math.random() * conversation.members.length)]
            : conversation.members[0];

          // Let other members know who the new admin is
          await conversation.populate('admin', 'fullName');
          messageContent += ` ${ conversation.admin.fullName } is the new admin.`;
        }

        const message = new req.models.Message({
          conversationId: id,
          type: 'notification',
          content: messageContent,
        });

        await message.save();

        // TODO: emit new message and updated converstion via websockets
        // so clients can display message and update participants list
        // (new admin will also have a delete group button newly displayed)
      }
    }
    
    if (isDeletedAll) {
      // Remove record (and cascade deleted associated messages)
      await conversation.remove();

      return res.sendStatus(204);
    }

    // Not all members have deleted conversation
    await conversation.save();

    // Mark all associated messages as 'deleted' for current user
    // User may have deleted conversation previously so oldest
    // messages might already be marked as deleted
    const messages = await req.models.Message.find()
      .and([
        { conversationId: id },
        { deletedBy: { $nin: [req.user._id] } },
      ])
      .exec();

    const promises = messages.map(async (message) => {
      message.deletedBy.push(req.user._id);

      // Mark message as 'read' for current user if not already
      // (they can also delete chat without looking at message)
      if (!message.readBy.includes(req.user._id)) {
        message.readBy.push(req.user._id);
      }

      // Check if all members have now deleted this message
      const isDeletedAll = conversation.members.every((member) => message.deletedBy.includes(member));
      isDeletedAll ? await message.remove() : await message.save();
    });

    await Promise.all(promises);

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

exports.deleteGroup = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify that conversation exists
    const conversation = await req.models.Conversation.findById(id).exec();

    if (!conversation) {
      return res.status(400).json({ message: 'Conversation doesn\'t exist' });
    }

    // Verify that conversation is for a group, not private
    if (conversation.type === 'private') {
      return res.status(400).json({ message: 'You may only unilaterally delete a group conversation' });
    }

    // Verify that current user is creator of this conversation
    if (!(conversation.admin.equals(req.user._id))) {
      return res.status(403).json({ message: 'Only the creator of the group may delete this conversation' });
    }

    await conversation.remove();

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
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
