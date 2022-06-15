const mongoose = require('mongoose');

const { Schema } = mongoose;

const advertisementSchema = new Schema({
  brandName: String,
  tagline: String,
  backgroundUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('Advertisement', advertisementSchema);
