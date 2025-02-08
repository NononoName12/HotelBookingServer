const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const session = require("express-session");
// const MongoDBStore = require("connect-mongodb-session")(session);
const cors = require("cors");
const hotelRoutes = require("./routes/hotel");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const Session = require("./models/Session");
const User = require("./models/user");
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const app = express();
// Middleware dùng để phân tích dữ liệu từ request body có định dạng JSON.
app.use(bodyParser.json());
app.use(cookieParser());

// Middleware xử lý dữ liệu gửi qua form (kiểu application/x-www-form-urlencoded).
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "https://hotel-booking-client-ashen.vercel.app",
      "https://hotel-booking-admin-rho.vercel.app",
    ],
    credentials: true, // Cho phép cookie & header auth
  })
);

// Xử lý preflight request (OPTIONS)
app.options("*", cors());

// Cấu hình CORS cho phép hoặc từ chối các yêu cầu từ những miền khác (origins) dựa trên danh sách allowedOrigins
// app.use(
//   cors({
//     //Hàm tùy chỉnh xác định logic để chấp nhận hoặc từ chối các yêu cầu từ các nguồn khác nhau (origins).
//     origin: (origin, callback) => {
//       // origin: Là miền (domain) của yêu cầu
//       if (!origin || allowedOrigins.includes(origin)) {
//         // Nếu không có origin (khi request từ server-side) hoặc origin hợp lệ
//         // Callback: Là hàm callback dùng để báo cáo kết quả (chấp nhận hoặc từ chối yêu cầu).
//         callback(null, true);
//       } else {
//         // Nếu origin không hợp lệ
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true, // Cho phép gửi cookie và header auth
//   })
// );

app.use(async (req, res, next) => {
  const token = req.cookies.token; // Lấy token từ cookie

  if (!token) {
    console.log("Không có token trong cookie.");
    return next(); // Nếu không có token trong cookie, tiếp tục đến middleware hoặc route tiếp theo
  }

  try {
    // Tìm token trong MongoDB (trong collection Session)
    const session = await Session.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      console.log("Không tìm thấy token trong session.");
      return next(); // Nếu không tìm thấy token trong MongoDB, tiếp tục middleware khác
    }

    // Tìm thông tin người dùng từ session
    const user = await User.findById(session.userId);
    if (!user) {
      req.isLoggedIn = false;
      console.log("Không tìm thấy user.");
      return next(); // Nếu không tìm thấy user, tiếp tục middleware khác
    }

    req.user = user; // Gán thông tin user vào request
    req.isLoggedIn = true; // Gán thông tin trạng thái login vào request
    console.log("Xác thực thành công:", req.user);
    next(); // Tiếp tục route hoặc middleware tiếp theo
  } catch (err) {
    console.error("Lỗi server:", err);
    return next(); // Xử lý lỗi nhưng vẫn tiếp tục middleware khác
  }
});
// Định tuyến (routing) trong ứng dụng Express.js
app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/", hotelRoutes);

// Middleware để xử lý các yêu cầu không tìm thấy (404 Not Found)
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Thiết lập kết nối với MongoDB bằng Mongoose và khởi động máy chủ Express sau khi kết nối thành công
mongoose
  .connect(MONGODB_URI) //Đây là phương thức của Mongoose dùng để kết nối đến cơ sở dữ liệu
  .then((result) => {
    // Thực thi khi kết nối thành công
    console.log("Connect");
    app.listen(5000);
  })
  // Bắt lỗi khi xảy ra lỗi
  .catch((err) => {
    console.log(err);
  });
