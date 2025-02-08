const mongoose = require("mongoose");

const Schema = mongoose.Schema; // Định nghĩa cấu trúc (structure) cho các tài liệu (documents) trong một collection trong MongoDB

// Định nghĩa cấu trúc cho tài liệu room với các trường như sau
const roomSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  maxPeople: {
    type: Number,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  roomNumbers: {
    type: [Number], // Thay đổi từ Number thành mảng để lưu nhiều số phòng
    required: true,
  },
  // hotel: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Hotel", // Tham chiếu đến mô hình Hotel
  //   required: true,
  // },
});
module.exports = mongoose.model("Room", roomSchema);
