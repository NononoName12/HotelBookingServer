const Transaction = require("../models/transaction");
const Hotel = require("../models/hotel");
const User = require("../models/user");
const Room = require("../models/room");
const ObjectId = require("mongoose").Types.ObjectId;

// Lấy thông tin về tất cả hotel
exports.getHotels = async (req, res, next) => {
  try {
    // Tìm tất cả các khách sạn và chỉ trả về 2 trường _id và name
    const hotels = await Hotel.find({}, "_id name");
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// Lấy thông tin thông kê doanh thu
exports.getStats = async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    const transactionCount = await Transaction.countDocuments();
    // Phương thức aggregate của Mongoose để thực hiện một phép toán tổng hợp (aggregation) trên collection Transaction trong MongoDB
    const totalRevenue = await Transaction.aggregate([
      {
        // $group được sử dụng để nhóm các tài liệu lại với nhau và thực hiện các phép toán
        $group: {
          _id: null, // Không nhóm theo bất kỳ giá trị cụ thể nào, muốn tính toán tổng cho toàn bộ collection.
          total: { $sum: "$price" }, // Tính tổng các giá trị của trường `price`
        },
      },
    ]);
    const avgMonthlyRevenue = (totalRevenue[0].total / 12).toFixed(2);

    res.status(200).json({
      userCount,
      transactionCount,
      totalRevenue: totalRevenue[0].total,
      avgMonthlyRevenue,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

// Lấy thông tin 8 giao dịch gần nhất
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .sort({ dateStart: -1 }) // Sắp xếp theo dateStart giảm dần
      .limit(8) // Giới hạn số lượng kết quả trả về là 8
      .populate("hotel") // Nạp dữ liệu từ bảng Hotel
      .exec();

    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Lấy thông tin tất cả giao dịch kèm thông tin khác sạn
exports.getTransactionsTotal = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate("hotel") // Nạp dữ liệu từ bảng Hotel
      .exec(); //Phương thức trong Mongoose được sử dụng để thực hiện truy vấn và trả về một promise

    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Lấy thông tin tất cả hotel
exports.getHotels = async (req, res, next) => {
  Hotel.find()
    .then((hotels) => {
      res.json({
        hotels: hotels,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Lấy thông tin tất cả phòng
exports.getRooms = async (req, res, next) => {
  Room.find()
    .then((room) => {
      res.json({
        rooms: room,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

// Xóa khách sạn dựa vào id truyền lên từ client
exports.deleteHotel = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Tìm document với id là chuỗi
    const checkTransaction = await Transaction.findOne({
      hotel: id,
    });
    if (checkTransaction) {
      return res.status(404).json({ message: "The hotel is in transaction" });
    }

    // Xóa document theo ID
    const deletedDocument = await Hotel.findByIdAndDelete(id);

    if (!deletedDocument) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({
      message: "Document deleted successfully",
      document: deletedDocument,
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting document", error });
  }
};

// Thêm mới 1 khách sạn
exports.postAddHotels = async (req, res, next) => {
  try {
    const dataInput = req.body;

    // Tách chuỗi images thành mảng
    const imagesArray = dataInput.images
      .split("\n")
      .map((image) => image.trim());

    // Tách chuỗi rooms thành mảng
    const roomsArray = dataInput.rooms.split("\n").map((room) => room.trim());

    // Tìm ID của các phòng dựa trên tiêu đề
    // Tìm tất cả các tài liệu có trường title nằm trong mảng roomsArray
    // Chỉ lấy trường _id của các tài liệu
    const roomIds = await Room.find({ title: { $in: roomsArray } }).select(
      "_id"
    );

    // Chuyển đổi kết quả thành mảng các ID
    const roomIdList = roomIds.map((room) => room._id);

    // Tạo hotel mới từ dữ liệu đầu vào
    const newHotel = new Hotel({
      name: dataInput.name,
      address: dataInput.address,
      city: dataInput.city,
      cheapestPrice: dataInput.price,
      desc: dataInput.description,
      distance: dataInput.distance,
      featured: dataInput.featured,
      photos: imagesArray,
      rooms: roomIdList, // Gán mảng ID phòng
      title: dataInput.title,
      type: dataInput.type,
      rating: 1,
    });

    // Lưu hotel mới vào MongoDB
    console.log(newHotel, "dataHotel New");
    const savedHotel = await newHotel.save();
    res.status(201).json(newHotel); // Trả về hotel vừa lưu
  } catch (err) {
    res.status(500).json({ message: "Error adding hotel", error: err.message });
  }
};

// Xóa phòng dựa vào id truyền lên từ client
exports.deleteRoom = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Kiểm tra xem phòng này có được sử dụng trong bất kỳ giao dịch nào không
    const transactionsUsingRoom = await Transaction.find({
      "room.idRoom": id,
    });

    if (transactionsUsingRoom.length > 0) {
      // Nếu có giao dịch chứa phòng này, không cho phép xóa
      return res.status(400).json({
        message: "The room is in transaction",
      });
    }

    // Nếu không có giao dịch nào chứa phòng này, tiến hành xóa phòng
    const deletedRoom = await Room.findByIdAndDelete(id);

    if (!deletedRoom) {
      return res.status(404).json({
        message: "Document not found.",
      });
    }

    // Tìm idRoom trong mảng rooms của model hotel và xóa nó đi
    // Tìm khách sạn chứa roomId trong mảng rooms
    const hotel = await Hotel.findOne({ rooms: id });
    if (!hotel) {
      console.log("No hotel found containing this room.");
      return;
    }

    // Lấy idHotel từ tài liệu Hotel tìm được
    const idHotel = hotel._id;

    // Xóa room khỏi mảng rooms của Hotel
    const updatedHotel = await Hotel.findByIdAndUpdate(
      idHotel,
      {
        $pull: { rooms: id }, // Loại bỏ roomId khỏi mảng rooms
      },
      { new: true } // Trả về bản ghi đã được cập nhật
    );

    res.status(200).json({
      message: "Document deleted successfully.",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error.",
      error: err.message,
    });
  }
};

// Tạo 1 phòng mới
exports.postAddRooms = async (req, res, next) => {
  try {
    const dataInput = req.body;

    // Tách chuỗi roomNumbers thành mảng
    const roomNumbersArray = dataInput.rooms
      .split(/\s*,\s*/) // Sử dụng regex để tách bằng dấu phẩy, có hoặc không có khoảng trắng
      .map((roomNumber) => roomNumber.trim());

    // Tạo room mới từ dữ liệu đầu vào
    const newRoom = new Room({
      title: dataInput.title,
      desc: dataInput.description,
      price: dataInput.price,
      maxPeople: dataInput.maxPeople,
      roomNumbers: roomNumbersArray,
      // hotel: dataInput.seclectHotel,
    });

    // Lưu hotel mới vào MongoDB
    console.log(newRoom, "newRoom New");
    const savedRooms = await newRoom.save();
    const idRoom = newRoom._id; // Lấy _id của phòng vừa tạo
    res.status(201).json(savedRooms); // Trả về room vừa lưu

    // Lưu idRoom đó vào mảng rooms của hotel
    await Hotel.findByIdAndUpdate(
      dataInput.seclectHotel, // ID của hotel đã chọn
      { $push: { rooms: idRoom } }, // Thêm ID của phòng vào mảng rooms
      { new: true } // Trả về document sau khi cập nhật
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error adding room", error: err.message });
  }
};

// Lấy thông tin khách sạn cần chỉnh sửa
exports.getEditHotels = async (req, res, next) => {
  const hotelId = req.params.id;
  try {
    const hotel = await Hotel.findById(hotelId).populate("rooms"); // Populate rooms để lấy thông tin chi tiết phòng
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    res.status(200).json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin phòng cần chỉnh sửa
exports.getEditRooms = async (req, res, next) => {
  const roomId = req.params.id;
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    // Sử dụng từ khóa `new` khi tạo ObjectId
    const hotel = await Hotel.findOne({
      rooms: new ObjectId(roomId), // Khởi tạo ObjectId đúng cách
    });

    res.status(200).json({ room, hotel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin khách sạn
exports.updateEditHotels = async (req, res, next) => {
  const hotelId = req.params.id; // Lấy hotelId từ URL params
  const {
    name,
    address,
    city,
    description,
    distance,
    featured,
    images,
    rooms,
    price,
    title,
    type,
  } = req.body; // Lấy dữ liệu từ form client gửi lên

  try {
    // Tách chuỗi images thành mảng
    const imagesArray = images.split("\n").map((image) => image.trim());

    // Tách chuỗi rooms thành mảng
    const roomsArray = rooms.split("\n").map((room) => room.trim());

    // Tìm ID của các phòng dựa trên tiêu đề
    const roomIds = await Room.find({ title: { $in: roomsArray } }).select(
      "_id"
    );

    // Chuyển đổi kết quả thành mảng các ID
    const roomIdList = roomIds.map((room) => room._id);

    // Tìm khách sạn theo ID và cập nhật thông tin
    const updatedHotel = await Hotel.findByIdAndUpdate(
      hotelId,
      {
        name, // Cập nhật tên khách sạn
        address, // Cập nhật địa chỉ
        city, // Cập nhật thành phố
        desc: description, // Cập nhật mô tả
        rooms: roomIdList, // Cập nhật danh sách phòng
        photos: imagesArray,
        cheapestPrice: price,
        distance,
        featured,
        title,
        type,
      },
      { new: true, runValidators: true } // Tùy chọn để trả về dữ liệu mới sau khi cập nhật và kiểm tra validate
    );

    if (!updatedHotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res
      .status(200)
      .json({ message: "Hotel updated successfully", hotel: updatedHotel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin phòng
exports.updateEditRooms = async (req, res, next) => {
  const roomId = req.params.id; // Lấy roomId từ URL params
  const {
    description,
    maxPeople,
    price,
    rooms,
    seclectHotel,
    title,
    hotelPrev,
  } = req.body; // Lấy dữ liệu từ form client gửi lên

  try {
    // Tách chuỗi roomNumbers thành mảng
    const roomNumbersArray = rooms
      .split(/\s*,\s*/) // Sử dụng regex để tách bằng dấu phẩy, có hoặc không có khoảng trắng
      .map((roomNumber) => roomNumber.trim());

    // Tìm phòng theo ID và cập nhật thông tin
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        desc: description, // Cập nhật mô tả
        maxPeople: maxPeople,
        price: price,
        roomNumbers: roomNumbersArray,
        title,
        // hotel: seclectHotel,
      },
      { new: true, runValidators: true } // Tùy chọn để trả về dữ liệu mới sau khi cập nhật và kiểm tra validate
    );

    if (!updatedRoom) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (seclectHotel !== hotelPrev) {
      // Tìm idRoom trong mảng rooms của hotel và xóa đi
      if (hotelPrev) {
        await Hotel.findByIdAndUpdate(
          hotelPrev, // ID của khách sạn cũ
          { $pull: { rooms: roomId } }, // Xóa roomId khỏi mảng rooms
          { new: true } // Trả về document sau khi cập nhật
        );
      }

      // Lưu idRoom đó vào mảng rooms của hotel
      await Hotel.findByIdAndUpdate(
        seclectHotel, // ID của hotel đã chọn
        { $push: { rooms: roomId } }, // Thêm ID của phòng vào mảng rooms
        { new: true } // Trả về document sau khi cập nhật
      );
    }

    res
      .status(200)
      .json({ message: "Hotel updated successfully", room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
