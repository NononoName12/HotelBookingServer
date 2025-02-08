const mongoose = require("mongoose");

const Schema = mongoose.Schema; // Định nghĩa cấu trúc (structure) cho các tài liệu (documents) trong một collection trong MongoDB

// Định nghĩa cấu trúc cho tài liệu hotel với các trường như sau
const hotelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  distance: {
    type: String,
    required: true,
  },
  photos: {
    type: Array,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  rating: {
    type: String,
    required: true,
  },
  featured: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  cheapestPrice: {
    type: String,
    required: true,
  },
  rooms: [
    {
      type: Schema.Types.ObjectId,
      ref: "Room", // Tham chiếu đến mô hình Room
    },
  ],
});
module.exports = mongoose.model("Hotel", hotelSchema);
