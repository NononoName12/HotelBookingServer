const express = require("express");
const adminController = require("../controllers/admin"); //
const verifyAdmin = require("../middleware/verifyAdmin"); // Đường dẫn đến file middleware để kiễm tra người dùng có phải là Admin không
const authMiddleware = require("../middleware/auth"); // Đường dẫn đến file middleware để xác thực
const router = express.Router(); //Phương thức này tạo ra một instance của Router từ Express

// /hotels =>GET
router.get("/hotels", authMiddleware, verifyAdmin, adminController.getHotels);

// /stats =>GET
router.get("/stats", authMiddleware, verifyAdmin, adminController.getStats);

// /stats =>GET
router.get(
  "/transactions",
  authMiddleware,
  verifyAdmin,
  adminController.getTransactions
);

// /transactionsTotal =>GET
router.get(
  "/transactionsTotal",
  authMiddleware,
  verifyAdmin,
  adminController.getTransactionsTotal
);

// /hotels =>GET
router.get("/hotels", authMiddleware, verifyAdmin, adminController.getHotels);

// /edit-hotels =>GET
router.get(
  "/edit-hotels/:id",
  authMiddleware,
  verifyAdmin,
  adminController.getEditHotels
);

// /edit-rooms =>GET
router.get(
  "/edit-rooms/:id",
  authMiddleware,
  verifyAdmin,
  adminController.getEditRooms
);

// /edit-hotels =>UPDATE
router.put(
  "/edit-hotels/:id",
  authMiddleware,
  verifyAdmin,
  adminController.updateEditHotels
);

// /edit-rooms =>UPDATE
router.put(
  "/edit-rooms/:id",
  authMiddleware,
  verifyAdmin,
  adminController.updateEditRooms
);

// /rooms =>GET
router.get("/rooms", authMiddleware, verifyAdmin, adminController.getRooms);

// /hotels =>DELETE
router.delete(
  "/hotels/:id",
  authMiddleware,
  verifyAdmin,
  adminController.deleteHotel
);

// /rooms =>DELETE
router.delete(
  "/rooms/:id",
  authMiddleware,
  verifyAdmin,
  adminController.deleteRoom
);

// /addhotels =>POST
router.post(
  "/add-hotels",
  authMiddleware,
  verifyAdmin,
  adminController.postAddHotels
);

// /addrooms =>POST
router.post(
  "/add-rooms",
  authMiddleware,
  verifyAdmin,
  adminController.postAddRooms
);

module.exports = router; // Xuất một đối tượng router từ một module
