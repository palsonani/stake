import crypto from 'crypto';
import dotenv from 'dotenv';
import Payment from '../../models/Payment.js'; 
import Logs from '../../models/Logs.js'; 

dotenv.config();

export const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount, method } = req.body;

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    try {
        if (generated_signature === razorpay_signature) {
            // Log successful payment verification
            await Logs.create({
                userId: userId || null,
                action: `Payment verified successfully: razorpay_order_id=${razorpay_order_id}, razorpay_payment_id=${razorpay_payment_id}`,
                logTime: new Date(),
            });

            // Store payment details in the database
            await Payment.create({
                transactionId: razorpay_payment_id,
                userId: userId,
                amount: amount,
                method: method,
                status: 'Success',
                metaId: razorpay_order_id
            });

            res.json({ message: 'Payment verified and stored successfully' });
        } else {
            // Log invalid signature attempt
            await Logs.create({
                userId: userId || null,
                action: `Payment verification failed: Invalid signature for razorpay_order_id=${razorpay_order_id}`,
                logTime: new Date(),
            });
            res.status(400).json({ error: 'Invalid signature' });
        }
    } catch (error) {
        // Log error
        await Logs.create({
            userId: userId || null,
            action: `Verify payment error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        console.error('Error storing payment:', error);
        res.status(500).json({ error: 'Failed to store payment' });
    }
};
