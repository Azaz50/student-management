const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
  console.log("MongoDB Atlas Connected");
};

module.exports = connectDB;





// const mongoose = require('mongoose');

// const connectDB = async () => {
//     let db_url = "";
//     if (process.env.NODE_ENV === 'local') {
//         db_url = `mongodb://${process.env.LOCAL_DB_HOST}:${process.env.LOCAL_DB_PORT}/${process.env.LOCAL_DB_NAME}`;
//     } else {
//         db_url = `mongodb://${process.env.REMOTE_DB_USER}:${process.env.REMOTE_DB_PASS}@${process.env.REMOTE_DB_HOST}:${process.env.REMOTE_DB_PORT}/${process.env.REMOTE_DB_NAME}?authSource=admin`;
//     }

//     try {
//         await mongoose.connect(db_url);
//         console.log("Database connected successfully");
//     } catch (err) {
//         console.error("Database connection error:", err);
//         process.exit(1);
//     }
// }

// module.exports = connectDB;




