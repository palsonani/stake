import Razorpay from 'razorpay'
import dotenv from 'dotenv';
dotenv.config();
// Load environment variables from .env file
dotenv.config();

// Initialize Razorpay instance
export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});