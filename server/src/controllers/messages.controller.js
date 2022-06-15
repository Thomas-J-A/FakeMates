exports.fetchMessages = (req, res) => {
  res.send('Fetched messages');
};

exports.sendMessage = (req, res) => {
  res.send('Sent message');
};

exports.markMessageAsRead = (req, res) => {
  res.send('Message marked as read');
};
