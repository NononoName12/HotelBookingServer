const express = require("express");
const { check, validationResult } = require("express-validator"); // Xác thực và kiểm tra dữ liệu trong các ứng dụng Express.
const authController = require("../controllers/auth");
const router = express.Router(); //Phương thức này tạo ra một instance của Router từ Express


// /auth/signin => POST
router.post(
  "/signin",
  [
    // Validate dữ liệu đăng nhập
    check("email").isEmail().withMessage("Email không hợp lệ"),
    check("password")
      .notEmpty()
      .withMessage("Mật khẩu không được để trống")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  ],
  authController.postSignin
);

// /auth/signup => POST
router.post(
  "/signup",
  [
    // Validate các trường đầu vào
    check("username")
      .trim()
      .notEmpty()
      .withMessage("Tên đăng nhập là bắt buộc")
      .isLength({ min: 3 })
      .withMessage("Tên đăng nhập phải ít nhất 3 ký tự"),
    check("fullName").trim().notEmpty().withMessage("Họ và tên là bắt buộc"),
    check("email").isEmail().withMessage("Email không hợp lệ").normalizeEmail(), // normalizeEmail() đảm bảo rằng địa chỉ email được chuyển đổi về một định dạng chuẩn
    check("password")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
    check("phoneNumber")
      .isMobilePhone()
      .withMessage("Số điện thoại không hợp lệ"),
  ],
  authController.postSignup
);

// /auth/logout => POST
router.post("/logout", authController.postLogout);

module.exports = router; // Xuất một đối tượng router từ một module
