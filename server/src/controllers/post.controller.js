exports.fetchPosts = async (req, res, next) => {
  try {
    const { userid, page } = req.query;

    const user = userid === req.user._id
      ? req.user
      : await req.models.User.findById(userid).exec();

    // Verify that user exists
    if (!user) {
      return res.status(400).json({ message: 'User doesn\'t exist' });
    }
  
    // Verify that posts don't belong to a stranger with a private account
    if (!(req.user.friends.includes(user._id)) && user.isPrivate) {
      // If current user requests own posts and they have a private
      // account this condition will also pass, so check for that too
      if (!user._id.equals(req.user._id)) {  
        return res.status(403).json({ message: 'These posts belong to a private account' });
      }
    }

    // Fetch paginated posts
    const limit = 10;
    const skip = (page - 1) * limit;

    const posts = await req.models.Post.find({ postedBy: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Check if there are more results
    const endIndex = page * limit;
    const totalCount = await req.models.Post.countDocuments({ postedBy: user._id }).exec();
    const hasMore = endIndex < totalCount;

    return res.status(200).json({
      posts,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const post = new req.models.Post({
      postedBy: req.user._id,
      content: req.body.content,
    });
    
    // Add imageUrl to doc if user added an
    // (optional) image to their post
    if (req.file) {
      post.imageUrl = req.file.path;
    }
    
    await post.save();
    
    return res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

exports.fetchPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await req.models.Post.findById(id)
      .populate('postedBy', 'isPrivate')
      .exec();

    // Verify that post exists
    if (!post) {
      return res.status(400).json({ message: 'Post doesn\'t exist' });
    }

    // Verify that post doesn't belong to a stranger with a private account
    if (!(req.user.friends.includes(post.postedBy._id)) && post.postedBy.isPrivate) {
      // If current user requests own post and they have a private
      // account this condition will also pass, so check for that too
      if (!post.postedBy._id.equals(req.user._id)) {
        return res.status(403).json({ message: 'This post belongs to a private account' });
      }
    }

    return res.status(200).json(post);    
  } catch (err) {
    next(err);
  }
};

exports.likePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const post = await req.models.Post.findById(id)
      .populate('postedBy', 'isPrivate')
      .exec();

    // Verify that post exists
    if (!post) {
      return res.status(400).json({ message: 'Post doesn\'t exist' });
    }

    // Verify that current user isn't liking their own post
    if (post.postedBy._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can\'t like your own post' });
    }

    // Verify that post doesn't belong to a stranger with a private account
    if (!(req.user.friends.includes(post.postedBy._id)) && post.postedBy.isPrivate) {
      return res.status(403).json({ message: 'This post belongs to a private account' });
    }

    // Update post
    if (post.likedBy.includes(req.user._id)) {
      // User has unliked post
      const index = post.likedBy.indexOf(req.user._id);
      post.likedBy.splice(index, 1);
    } else {
      // User has liked post
      post.likedBy.push(req.user._id);
    }
    
    await post.save();
    
    return res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

exports.removePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await req.models.Post.findById(id).exec();

    // Verify that post exists
    if (!post) {
      return res.status(400).json({ message: 'Post doesn\'t exist' });
    }

    // Verify that the post belongs to the person making the request
    // Compare two ObjectIds
    if (!post.postedBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'You may only remove your own posts' });
    }

    await post.remove();

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
