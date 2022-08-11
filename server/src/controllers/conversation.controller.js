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
          { members: { $in: [req.user._id] }},
          { deletedBy : { $nin: [req.user._id] }},
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
            $cond: [{ $in: [req.user._id, { $ifNull: ['$messages.readBy', []]}]}, 0, 1]
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
          { $project: { fullName: 1, avatarUrl: 1 }},
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
          { $project: { fullName: 1 }},
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
        { members: { $in: [req.user._id] }}, 
        { deletedBy : { $nin: [req.user._id] }},
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

exports.createNewChat = (req, res) => {
  res.send('Created new chat');
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

    // // Calculate amount of unread messages for each conversation
    // // Create an array of conversationIds
    // const conversationIds = conversations.map((c) => c._id);

    // const unreadCounts = await req.models.Message.aggregate()
    //   .match({ conversationId: { $in: conversationIds }})
    //   .group({
    //     _id: '$conversationId',
    //     unreadCount: {
    //       $sum: {
    //         $cond: [{ '$messages.readBy': { $nin: [req.user._id]}}, 1, 0]
    //       }
    //     },
    //   })
    //   .exec();

    // // Add an unreadCount field to corresponding conversation doc
    // unreadCounts.forEach((count) => {

    // })




    // from: 'users',
    // localField: 'conversation.members',
    // foreignField: '_id',
    // as: 'conversation.members',