
import Coupon from '../../models/Coupon.js';
import Wallet from '../../models/Wallet.js';
import WalletTransaction from '../../models/WalletTransaction.js';

export const redeemCoupon = async (req, res) => {
    const { userId, couponCode } = req.body;

    try {
        // Find the coupon by code
        const coupon = await Coupon.findOne({
            where: {
                code: couponCode,
                isRedeemed: false
            }
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or already redeemed coupon'
            });
        }

        // Find the user's wallet
        const wallet = await Wallet.findOne({
            where: {
                userId
            }
        });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found for the user'
            });
        }

        // Update the wallet balance
        const newAmount = parseFloat(wallet.currentAmount) + parseFloat(coupon.amount);
        await wallet.update({
            currentAmount: newAmount,
            totalAmount: newAmount // Assuming totalAmount should also be updated
        });

        // Create a wallet transaction record
        await WalletTransaction.create({
            walletId: wallet.id,
            userId,
            amount: coupon.amount,
            transactionType: 'Coupon Redemption',
            transactionDirection: 'credit',
            description: `Coupon ${coupon.code} redeemed`,
            transactionTime: new Date()
        });

        // Mark the coupon as redeemed
        await coupon.update({
            isRedeemed: true,
            redemptionDate: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Coupon redeemed successfully',
            data: {
                wallet,
                coupon
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to redeem coupon',
        });
    }
};
