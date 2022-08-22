exports.fetchResults = async (req, res, next) => {
  try {
    const { q, page } = req.query

    // Fetch paginated users which contain query string in their names
    const limit = 10;
    const skip = (page - 1) * limit;

    let users = await req.models.User
      .find({ fullName: { $regex: q, $options: 'i' }})
      .skip(skip)
      .limit(limit)
      .select('fullName avatarUrl isPrivate')
      .exec();

    // Find relationship status between current user and each search result;
    // client must know if they should display a friend request button, etc
    // Results limited to ten per request so no significant response time delay
    const promises = users.map(async (user) => {
      let relationshipStatus;

      const friendRequest = await req.models.FriendRequest.findOne({
        $or: [
          { from: req.user._id, to: user._id },
          { from: user._id, to: req.user._id },
        ],
      }).exec();
      
      if (friendRequest) {
        switch (friendRequest.status) {
          case 1:
            relationshipStatus = 'pending';
            break;
          case 2:
            relationshipStatus = 'accepted';
            break;
          case 3:
            relationshipStatus = 'rejected';
            break;
        }
      } else if (user._id.equals(req.user._id)) {
        // Search result is current user
        relationshipStatus = 'oneself';
      } else {
        // Search result is a stranger
        relationshipStatus = 'none';
      }

      return {
        ...user._doc, // NOTE_1
        relationshipStatus,
      };
    });

    users = await Promise.all(promises);

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

// NOTE_1
// Mongoose queries return a mongoose object rather than a POJO, which contains all
// of the document data plus metadata. This metadata is hidden in console.log calls
// and after conversion to JSON - like in a res.json() call - hence why you don't normally
// need to specify the _doc property. However, when using the spread operator the metadata
// is copied over to the new object as well, hence in this case you must specify that you
// only want to copy the document details found in the _doc property
// Alternatively, you can call the .lean() method on the query to return POJOs from the original query
// Left here as a reminder
