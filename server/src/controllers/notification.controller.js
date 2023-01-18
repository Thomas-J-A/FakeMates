exports.fetchNotifications = async (req, res, next) => {
  try {
    const { page } = req.query;

    // Fetch (paginated) notifications for current user 
    // which haven't been soft deleted
    const limit = 10;
    const skip = (page - 1) * limit;

    const notifications = await req.models.Notification.find({})
      .and([
        { recipients: { $in: [req.user._id]}},
        { deletedBy: { $nin: [req.user._id]}},
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'fullName avatarUrl isPrivate')             // isPrivate field not necessary?
      .exec();

    // Check if there are more results
    const endIndex = page * limit;
    const totalCount = await req.models.Notification.countDocuments({
        $and: [
          { recipients: { $in: [req.user._id]}},
          { deletedBy: { $nin: [req.user._id]}},
        ],
      })
      .exec();
    const hasMore = endIndex < totalCount;
    const resultsRemaining = hasMore ? totalCount - endIndex : 0;

    return res.status(200).json({
      notifications,
      hasMore,
      resultsRemaining,
    });
  } catch (err) {
    next(err);
  }
};

exports.handleNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.query;

    const notification = await req.models.Notification.findById(id).exec();

    // Verify that the notification exists
    if (!notification) {
      return res.status(400).json({ message: 'Notification doesn\'t exist' });
    }

    // Verify that current user is one of the recipients of this notification
    if (!notification.recipients.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'You are not authorised to update this notification' });
    }

    if (action === 'read') {
      // Mark notification as read by current user
      notification.readBy.push(req.user._id);

      await notification.save();
    } else {
      // Mark notification as deleted by current user
      notification.deletedBy.push(req.user._id);

      // Check if all recipients have now 'deleted' this notification
      notification.recipients.length === notification.deletedBy.length
        ? await notification.remove()
        : await notification.save();
    }

    return res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
};
