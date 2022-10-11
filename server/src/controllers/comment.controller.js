exports.fetchComments = async (req, res, next) => {
  try {
    const { postid, page } = req.query;
    
    const post = await req.models.Post.findById(postid)
      .populate('postedBy', 'isPrivate')
      .exec();
    
    // Verify that post exists
    if (!post) {
      return res.status(400).json({ message: 'Post doesn\'t exist' });
    }

    // Verify that post doesn't belong to a stranger with a private account
    if (!(req.user.friends.includes(post.postedBy._id)) && post.postedBy.isPrivate) {
      // If post belongs to current user and they have a private account
      // this condition will also pass, so check for that too
      if (!post.postedBy._id.equals(req.user._id)) {  
        return res.status(403).json({ message: 'You can\'t view these comments' });
      }
    }
      
    // Fetch paginated comments
    const limit = 5;
    const skip = (page - 1) * limit;

    const comments = await req.models.Comment.find({ postId: post._id })
      // .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('postedBy', 'fullName avatarUrl isPrivate')
      .exec();

    // Check if there are more results, and if so how many
    const endIndex = page * limit;
    const totalCount = await req.models.Comment.countDocuments({ postId: post._id }).exec();
    const hasMore = endIndex < totalCount;
    const resultsRemaining = hasMore ? totalCount - endIndex : 0;

    return res.status(200).json({
      comments,
      hasMore,
      resultsRemaining,
    });
  } catch (err) {
    next(err);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const { postid } = req.query;
    const { content } = req.body;

    const post = await req.models.Post.findById(postid)
      .populate('postedBy', 'isPrivate')
      .exec();
    
    // Verify that post exists
    if (!post) {
      return res.status(400).json({ message: 'Post doesn\'t exist' });
    }

    // Verify that post belongs to either current user or a friend
    if (!(post.postedBy._id.equals(req.user._id) || req.user.friends.includes(post.postedBy._id))) {
      return res.status(403).json({ message: 'You cannot comment on this post' });
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

    // Populate some fields in order to display more info in UI
    await comment.populate({
      path: 'postedBy',
      select: 'fullName avatarUrl isPrivate',
    });

    return res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

exports.likeComment = async (req, res, next) => {
  // Users can like comments (not their own) on their own posts,
  // their friend's posts, and posts of other user's with a public
  // account, but not posts on private accounts
  try {
    const { id } = req.params;
    
    const comment = await req.models.Comment.findById(id)
      .populate('postedBy', 'fullName avatarUrl isPrivate')
      .exec();

    // Verify that comment exists
    if (!comment) {
      return res.status(400).json({ message: 'Comment doesn\'t exist' });
    }

    // Verify that current user isn't liking their own comment
    if (comment.postedBy._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can\'t like your own comment' });
    }

    // Verify that post doesn't belong to a stranger with a private account
    const post = await req.models.Post.findById(comment.postId)
      .populate('postedBy', 'isPrivate')
      .exec();

    if (!(req.user.friends.includes(post.postedBy._id)) && post.postedBy.isPrivate) { 
      // If post belongs to current user and they have a private account
      // this condition will also pass, so check for that too
      if (!post.postedBy._id.equals(req.user._id)) {
        return res.status(403).json({ message: 'You can\'t view these comments' });
      }
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
