exports.fetchTimeline = async (req, res, next) => {
  try {
    const { page } = req.query;

    // Fetch paginated posts
    const limit = 10;
    const skip = (page - 1) * limit;

    const posts = await req.models.Post.find({
        $or: [
          { postedBy: req.user._id },
          { postedBy: { $in: req.user.friends }},
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('postedBy', 'fullName avatarUrl')
      .exec();

    // Check if there are more results
    const endIndex = page * limit;
    const totalCount = await req.models.Post.countDocuments({
      $or: [
        { postedBy: req.user._id },
        { postedBy: { $in: req.user.friends }},
      ],
    }).exec();

    const hasMore = endIndex < totalCount;

    return res.status(200).json({
      posts,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
};
