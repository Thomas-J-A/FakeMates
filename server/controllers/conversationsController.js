exports.fetchChats = (req, res) => {
  res.send('Fetched chats');
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
