const mongoose = require("mongoose");
const User = require("../models/user"); // Đảm bảo đường dẫn chính xác đến mô hình User
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session");

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;
// Nhận thông tin đăng nhập từ client và xử lí
exports.postSignin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!email) {
      return res.status(400).json({
        path: "/login",
        pageTitle: "Login",
        errorMessage: "Email is required",
        validationErrors: [],
      });
    }

    if (!errors.isEmpty()) {
      return res.status(422).json({
        path: "/login",
        pageTitle: "Login",
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array(),
      });
    }

    // Tìm người dùng qua email
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(422).json({
        path: "/login",
        pageTitle: "Login",
        errorMessage: "Invalid email or password.",
        validationErrors: [],
      });
    }

    // Kiểm tra mật khẩu
    const doMatch = await bcrypt.compare(password, user.password);
    if (!doMatch) {
      return res.status(422).json({
        path: "/login",
        pageTitle: "Login",
        errorMessage: "Invalid email or password.",
        validationErrors: [],
      });
    }

    // Tạo JWT
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    // Tạo session và lưu vào DB
    const session = new Session({
      userId: user._id,
      token: token,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Hết hạn sau 5 phút
    });

    await session.save();

    // Gửi token qua cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 5 * 60 * 1000,
      sameSite: "None",
    }); // `secure: true` cho HTTPS
    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      path: "/login",
      pageTitle: "Login",
      errorMessage: "Server error during signin process.",
      validationErrors: [],
    });
  }
};

// Xử lý đang ký user
exports.postSignup = async (req, res, next) => {
  // Định nghĩa số vòng mã hóa
  const saltRounds = 10;
  // Xử lý lỗi validate đầu vào
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).json({
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  try {
    const { username, password, fullName, phoneNumber, email, isAdmin } =
      req.body;
    console.log(req.body);
    // Kiểm tra xem người dùng đã tồn tại chưa
    // Kiểm tra xem tên đầy đủ đã tồn tại chưa
    // Kiểm tra xem tên đăng nhập và email đã tồn tại chưa
    const existingUserByUsername = await User.findOne({ username });
    const existingUserByEmail = await User.findOne({ email });

    if (existingUserByUsername) {
      return res
        .status(400)
        .json({ errorMessage: "Tên đăng nhập đã được sử dụng" });
    }

    if (existingUserByEmail) {
      return res.status(400).json({ errorMessage: "Email đã được sử dụng" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Tạo người dùng mới với mật khẩu đã mã hóa
    const newUser = new User({
      username,
      password: hashedPassword,
      fullName,
      phoneNumber,
      email,
      isAdmin,
    });

    // Lưu người dùng vào cơ sở dữ liệu
    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công", user: newUser });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);

    res.status(500).json({
      message: "Đã xảy ra lỗi trong quá trình đăng ký",
      error: error.message,
    });
  }
};

// Nhận thông tin logout từ client và xử lí
exports.postLogout = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    // Xóa session khỏi DB
    await Session.deleteOne({ token });
    res.clearCookie("token");
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
