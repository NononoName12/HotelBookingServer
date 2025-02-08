const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    // Nếu có user đăng nhập và user đó phải là admin
    next();
  } else {
    // Không phải admin từ chối truy cập
    res.status(403).json("You are not allowed to access this resource");
  }
};

module.exports = verifyAdmin;
