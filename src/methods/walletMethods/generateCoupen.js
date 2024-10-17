import crypto from 'crypto';
import Coupon from '../../models/Coupon.js';
import transporter from '../../utility/emailTransporter.js';

const generateUniqueCouponCode = async () => {
    let isUnique = false;
    let code;

    while (!isUnique) {
        // Generate a 10-character uppercase coupon code
        code = crypto.randomBytes(5).toString('hex').toUpperCase();

        // Check if the code already exists in the database
        const existingCoupon = await Coupon.findOne({ where: { code } });

        // If the coupon does not exist, the code is unique
        if (!existingCoupon) {
            isUnique = true;
        }
    }

    return code;
};

export const generateCoupon = async (req, res) => {
    try {
        const { email, amount } = req.body;

        // Generate a unique coupon code
        const code = await generateUniqueCouponCode();

        // Create the coupon in the database
        const newCoupon = await Coupon.create({
            code,
            amount,
        });

        // Send the coupon to the user's email
        await transporter.sendMail({
            from: 'palsonani02@gmail.com',
            to: email,
            subject: 'Your Coupon Code',
            text: `Here is your coupon code: ${code}. Use it to redeem ${amount} in your account.`,
        });

        res.status(201).json({
            success: true,
            message: 'Coupon generated and sent to email successfully',
            data: newCoupon,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate coupon',
        });
    }
};
