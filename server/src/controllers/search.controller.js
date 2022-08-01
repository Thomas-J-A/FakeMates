exports.fetchResults = async (req, res, next) => {
  try {
    const { q, page } = req.query

    // Fetch paginated users which contain query string in their names
    const limit = 10;
    const skip = (page - 1 ) * limit;

    const users = await req.models.User
      .find({ fullName: { $regex: q, $options: 'i' }})
      .skip(skip)
      .limit(limit)
      .select('fullName avatarUrl')
      .exec();

    // Check if there are more results
    const endIndex = page * limit;
    const totalCount = await req.models.User.countDocuments({ fullName: { $regex: q, $options: 'i' }}).exec();
    const hasMore = endIndex < totalCount;

    return res.status(200).json({
      users,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
};
