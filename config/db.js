import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log(`URI : ${process.env.MONGODB_URI}`)
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;