import { razorpay } from "../../utility/razorpayUtils.js";
import Logs from '../../models/Logs.js'; 
export const createOrder = async (req, res) => {
    const { amount, currency, receipt, userId } = req.body;

    try {
        // Log request details
        await Logs.create({
            userId: userId || null, 
            action: `Create order request: amount=${amount}, currency=${currency}, receipt=${receipt}`,
            logTime: new Date(),
        });

        const options = {
            amount: amount * 100, 
            currency: currency,
            receipt: receipt
        };

        const order = await razorpay.orders.create(options);

        // Log successful order creation
        await Logs.create({
            userId: userId || null,
            action: `Order created successfully: ${JSON.stringify(order)}`,
            logTime: new Date(),
        });

        res.json(order);
    } catch (error) {
        // Log error
        await Logs.create({
            userId: userId || null,
            action: `Create order error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        console.error(error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};
