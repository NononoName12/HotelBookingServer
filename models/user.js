const mongoose = require("mongoose");
const Schema = mongoose.Schema; // Định nghĩa cấu trúc (structure) cho các tài liệu (documents) trong một collection trong MongoDB

// Định nghĩa cấu trúc cho tài liệu user với các trường như sau
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      // unique: true, // Đảm bảo email là duy nhất
      trim: true,
      lowercase: true, // Chuyển đổi email thành chữ thường
    },
    isAdmin: {
      type: Boolean,
      default: false, // Mặc định không phải admin
    },
  },
  { timestamps: true }
); // Tự động thêm trường `createdAt` và `updatedAt`

// Tạo mô hình từ schema
const User = mongoose.model("User", userSchema);

module.exports = User;
