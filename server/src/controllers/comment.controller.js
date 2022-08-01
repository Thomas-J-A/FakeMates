exports.fetchComments = async (req, res, next) => {
  try {
    const { postid, page } = req.query;
    
    // Verify that the post exists
    const post = await req.models.Post.findById(postid).exec();

    if (!post) {
      return res.status(400).json({ message: 'Post doesn\'t exist' });
    }
    
    // Fetch paginated comments
    const limit = 5;
    const skip = (page - 1) * limit;

    const comments = await req.models.Comment.find({ postId: postid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('postedBy', 'fullName avatarUrl')
      .exec();

    // Check if there are more results
    const endIndex = page * limit;
    const totalCount = await req.models.Comment.countDocuments({ postId: postid }).exec();
    const hasMore = endIndex < totalCount; 

    return res.status(200).json({
      comments,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const { postid } = req.query;
    const { content } = req.body;

    // Verify that the post exists
    const post = await req.models.Post.findById(postid).exec();

    if (!post) {
      return res.status(400).json({ message: 'Post doesn\'t exist' });
    }

    // Create a new comment
    const comment = new req.models.Comment({
      postedBy: req.user._id,
      postId: postid,
      content,
    });

    await comment.save();

    // Update commentsCount field on corresponding post
    post.commentsCount++;
    await post.save();

    return res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

exports.likeComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await req.models.Comment.findById(id).exec();

    // Verify that the comment exists
    if (!comment) {
      return res.status(400).json({ message: 'Comment doesn\'t exist' });
    }

    // Make sure the user isn't liking their own post
    if (comment.postedBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can\'t like your own comment' });
    }

    // Update comment
    if (comment.likedBy.includes(req.user._id)) {
      // User has unliked comment
      const index = comment.likedBy.indexOf(req.user._id);
      comment.likedBy.splice(index, 1);
    } else {
      // User has liked comment
      comment.likedBy.push(req.user._id);
    }

    await comment.save();

    return res.status(200).json(comment);
  } catch (err) {
    next(err);
  }
};
