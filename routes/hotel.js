const express = require("express");
const hotelController = require("../controllers/hotel");
const authMiddleware = require("../middleware/auth"); // Đường dẫn đến file middleware
const router = express.Router(); // express.Router() là một công cụ trong Express dùng để tách và quản lý route (định tuyến)

// / =>GET
router.get("/", hotelController.getIndex);

// /hotels/search => POST
router.post("/hotels/search", hotelController.postSearch);

// /hotels/:id =>GET
router.get("/hotels/:id", authMiddleware, hotelController.getDetail);

// /hotels/booking => POST
router.post("/hotels/booking", authMiddleware, hotelController.postBooking);

// /hotels/checkRoomAvailable => POST
router.post(
  "/hotels/checkRoomAvailable",
  authMiddleware,
  hotelController.postCheckRoomAvailable
);

// /hotels/transaction => POST
router.post(
  "/hotels/transactions",
  authMiddleware,
  hotelController.postTransaction
);

module.exports = router; // Xuất một đối tượng router từ một module
