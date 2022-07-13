exports.fetchPosts = async (req, res, next) => {
  try {
    const { userid } = req.query;

    // Verify that a user with userid exists
    const user = userid === req.user._id
      ? req.user._id
      : await req.models.User.findById(userid).exec();

    if (!user) {
      return res.status(400).json({ message: 'User doesn\'t exist' });
    }

    // Fetch all posts belonging to userid
    const posts = await req.models.Post.find({ postedBy: userid }).exec();

    return res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const post = new req.models.Post({
      postedBy: req.body.postedBy,
      content: req.body.content,
      likedBy: [],
      commentsCount: 0,
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

exports.likePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await req.models.Post.findById(id).exec();

    // Verify that the post exists
    if (!post) {
      return res.status(400).json({ message: 'Post doesn\'t exist' });
    }

    // Make sure the user isn't liking their own post
    if (post.postedBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can\'t like your own post' });
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

    // Verify that the post exists
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
