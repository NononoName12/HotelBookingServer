const Hotel = require("../models/hotel");
const Room = require("../models/room");
const Transaction = require("../models/transaction");
const User = require("../models/user");
const mongoose = require("mongoose");

// Lấy thông tin trả về trang HomePage
exports.getIndex = async (req, res, next) => {
  try {
    const hotels = await Hotel.find();

    // Đếm số lượng khách sạn theo khu vực
    const regions = ["Ha Noi", "Ho Chi Minh", "Da Nang"];
    const countByRegion = await Promise.all(
      regions.map((city) => Hotel.countDocuments({ city }))
    );

    // Đếm số lượng khách sạn theo từng loại (giả sử trường `type` có các giá trị khác nhau)
    const countByType = await Hotel.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    // Sắp xếp theo rating từ lớn đến nhỏ
    const sortedHotels = hotels.sort((a, b) => b.rating - a.rating);

    // Lấy ra 3 phần tử đầu tiên sau khi sắp xếp
    const top3Hotels = sortedHotels.slice(0, 3);
    res.json({
      // Dùng reduce nối các phần tử lại thành oject và trả về object
      countByRegion: regions.reduce((obj, region, index) => {
        obj[region] = countByRegion[index];
        return obj;
      }, {}),
      countByType,
      top3Hotels,
      user: req.user,
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.postSearch = async (req, res, next) => {
  const { city, check_in, check_out, adult, children, room } = req.body;
  console.log(city, check_in, check_out, adult, children, room);

  try {
    function formatDateToDDMMYYYY(date) {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0"); // Month is zero-indexed
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }

    const check_in_formatted = formatDateToDDMMYYYY(check_in);
    const check_out_formatted = formatDateToDDMMYYYY(check_out);

    console.log(check_in_formatted, "date");

    // Bước 1: Tìm các khách sạn trong thành phố yêu cầu
    let hotels = await Hotel.find({ city }).populate("rooms");

    if (hotels.length === 0) {
      return res.status(404).json({ message: "No hotels found in this city" });
    }

    const availableHotels = [];
    const totalGuests = adult + children; // Tổng số người cần ở

    // Bước 2: Kiểm tra phòng trống
    for (const hotel of hotels) {
      let idHotel = hotel._id;
      // Lấy thông tin các phòng theo roomIds
      const rooms = await Room.find({ _id: { $in: hotel.rooms } });
      const availableRooms = [];
      let totalRooms = 0;
      for (let roomInfo of rooms) {
        // Kiểm tra mảng roomNumbers có bằng với room input không

        // Kiểm tra xem phòng có đủ sức chứa không
        if (roomInfo.maxPeople >= totalGuests / room) {
          // checkMaxPeople = true;
          // if (roomInfo.roomNumbers.length >= room) {
          const bookings = await Transaction.find({
            hotel: hotel._id,
            // "room.idRoom": roomInfo._id,
            $and: [
              { dateStart: { $lte: check_out_formatted } }, // (ngày bắt đầu của giao dịch) nhỏ hơn hoặc bằng ngày check-out
              { dateEnd: { $gte: check_in_formatted } }, // (ngày kết thúc của giao dịch) lớn hơn hoặc bằng ngày check-in
            ],
          });

          // Nếu không có booking nào trùng thời gian, phòng sẽ trống
          if (bookings.length === 0) {
            totalRooms += roomInfo.roomNumbers.length;
          } else {
            const findAvailableRooms = (roomInfo, bookings) => {
              // Tập hợp tất cả các roomNumbers đã được đặt
              const bookedRooms = new Set();

              bookings.forEach((booking) => {
                booking.room.forEach((room) => {
                  // Lưu các số phòng đã được đặt vào tập hợp
                  room.numberRoom.forEach((number) => bookedRooms.add(number));
                });
              });

              // Lọc ra các phòng trống
              const availableRooms = roomInfo.roomNumbers.filter(
                (roomNumber) => !bookedRooms.has(roomNumber) // Chỉ giữ lại các phòng không nằm trong bookedRooms
              );

              // Trả về danh sách các phòng trống
              return {
                ...roomInfo,
                roomNumbers: availableRooms, // Cập nhật danh sách phòng trống
              };
            };

            const result = findAvailableRooms(roomInfo, bookings);
            console.log(result);
            totalRooms += result.roomNumbers.length;
          }
          // }
        }
      }

      if (totalRooms >= room) {
        availableHotels.push({
          hotel,
        });
      }
    }

    if (availableHotels.length === 0) {
      return res
        .status(404)
        .json({ message: "No hotels available for the selected criteria" });
    }

    res.json(availableHotels);
  } catch (error) {
    console.log(error);
  }
};

// Lấy thông tin chi tiết của 1 khách sạn
exports.getDetail = async (req, res, next) => {
  const hotelId = req.params.id; // Lấy hotelID từ route parameters

  if (!mongoose.Types.ObjectId.isValid(hotelId)) {
    return res.status(400).json({ message: "Invalid hotel ID" });
  }

  try {
    // Tìm khách sạn dựa trên hotelID và populate thông tin các phòng
    const hotel = await Hotel.findById(hotelId).populate("rooms");

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Trả về thông tin khách sạn và các phòng
    res.status(200).json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve hotel", error });
  }
};

// Xử lý đặt phòng
exports.postBooking = async (req, res, next) => {
  const dataForm = req.body;
  const idHotel = dataForm.hotel;

  try {
    if (!dataForm) {
      return res.status(400).json({ message: "No data Post" });
    }

    const formatDate = (date) => {
      // Chuyển chuỗi ISO 8601 thành đối tượng Date
      const dateObj = new Date(date);

      // Định dạng lại thành chuỗi "day/month/year"
      const formattedDate = dateObj.toLocaleDateString("en-GB"); // Sử dụng "en-GB" để có định dạng dd/mm/yyyy
      return formattedDate;
    };

    //Kiểm tra có fullName đó trong mongoDB chưa
    const checkEmail = await User.findOne({
      email: dataForm.reserveInfo.email,
    });

    // Nếu user không tồn tại, trả về lỗi
    if (!checkEmail) {
      return res.status(404).json({ message: "Email không tồn tại" });
    }

    // Tìm user theo full name
    const user = await User.findOne({
      email: dataForm.reserveInfo.email,
    });

    // Nếu user không tồn tại, trả về lỗi
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy user với email này" });
    }

    // Tạo mới transaction
    const newTransaction = new Transaction({
      user: user.username,
      hotel: new mongoose.Types.ObjectId(idHotel), // Chuyển đổi chuỗi thành ObjectId
      room: dataForm.seclectRooms,
      dateStart: formatDate(dataForm.dates[0].startDate),
      dateEnd: formatDate(dataForm.dates[0].endDate),
      price: dataForm.totalBill,
      payment: dataForm.paymentMethod,
      status: "Booked",
    });

    // Lưu vào database
    const savedTransaction = await newTransaction.save();

    // Trả về thông tin khách sạn và các phòng
    res.status(200).json({ message: "Post data success" });
  } catch (error) {
    console.error(error); // In ra log để kiểm tra chi tiết lỗi
    res.status(500).json({ message: "Failed Post data", error });
  }
};

// Kiểm tra phòng có sẵn
exports.postCheckRoomAvailable = async (req, res, next) => {
  const { date, hotel } = req.body;
  console.log(date[0].startDate, date[0].endDate, "Date");
  // const { startDate, endDate } = req.body;

  try {
    // Lấy danh sách các giao dịch liên quan
    const transactions = await Transaction.find({ hotel: hotel });

    // Chuyển ngày sang định dạng dd/mm/yyyy
    const formatDateToDDMMYYYY = (date) => {
      const d = date.getDate().toString().padStart(2, "0");
      const m = (date.getMonth() + 1).toString().padStart(2, "0");
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    };

    const startDate = formatDateToDDMMYYYY(new Date(date[0].startDate));
    const endDate = formatDateToDDMMYYYY(new Date(date[0].endDate));

    // Danh sách các phòng đã đặt trong khoảng thời gian
    let bookedRoomNumbers = [];

    const hotelData = await Hotel.findById(hotel).populate("rooms");
    if (!hotelData) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Lấy ra tất cả phòng trong khách sạn đó
    const allRooms = hotelData.rooms.map((room) => ({
      room,
      roomNumbers: room.roomNumbers,
    }));

    for (const transaction of transactions) {
      const transactionStart = transaction.dateStart;
      const transactionEnd = transaction.dateEnd;

      // So sánh xem ngày gửi lên có trùng không
      if (
        (startDate >= transactionStart && startDate <= transactionEnd) || // Start trùng
        (endDate >= transactionStart && endDate <= transactionEnd) || // End trùng
        (startDate <= transactionStart && endDate >= transactionEnd) // Bao phủ toàn bộ
      ) {
        // console.log(transaction, "transaction");
        for (const room of transaction.room) {
          bookedRoomNumbers.push({
            idRoom: room.idRoom.toString(),
            numberRoom: room.numberRoom, // Số phòng đã được đặt
          });
        }
      }
    }

    if (bookedRoomNumbers.length > 0) {
      console.log(bookedRoomNumbers, "bookedRoomNumbers");

      const availableRooms = allRooms.map((room) => {
        // Lọc các phòng đã được đặt theo idRoom
        const booked = bookedRoomNumbers.filter(
          (b) => b.idRoom.toString() === room.room._id.toString()
        );

        // Lấy tất cả các số phòng đã được đặt từ các phần tử phù hợp
        const bookedNumbers = booked.flatMap((b) => b.numberRoom);

        console.log(booked, "booked");

        return {
          room: room.room,
          // Lọc các số phòng còn trống (chưa được đặt)
          roomNumbers: room.roomNumbers.filter(
            (num) => !bookedNumbers.includes(num)
          ),
        };
      });

      return res.status(200).json({ roomData: availableRooms });
    } else {
      return res.status(200).json({ roomData: allRooms });
    }
  } catch (error) {
    return { status: 500, message: "Error checking dates", error };
  }
};

// Tạo 1 giao dịch mới
exports.postTransaction = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Tìm tất cả các giao dịch và kèm theo dữ liệu từ mô hình Hotel
    const transactions = await Transaction.find({ user: username })
      .populate("hotel") // Nạp dữ liệu từ bảng Hotel
      .exec();

    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this username" });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error); // Log the error for debugging
    res
      .status(500)
      .json({ message: "Failed to fetch transactions", error: error.message });
  }
};
