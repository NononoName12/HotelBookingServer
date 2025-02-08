const mongoose = require("mongoose");

const Schema = mongoose.Schema; // Định nghĩa cấu trúc (structure) cho các tài liệu (documents) trong một collection trong MongoDB

// Định nghĩa cấu trúc cho tài liệu transaction với các trường như sau
const transactionSchema = new Schema({
  user: {
    type: String,
    required: true,
  },
  hotel: {
    type: Schema.Types.ObjectId,
    ref: "Hotel", // Tham chiếu đến mô hình Hotel
    required: true,
  },
  room: [
    {
      idRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room", // Tham chiếu đến mô hình Room
        required: true,
      },
      numberRoom: [{ type: Number, required: true }],
      price: { type: Number, required: true },
    },
  ],
  dateStart: {
    type: String,
    required: true,
  },
  dateEnd: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  payment: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("Transaction", transactionSchema);
