import bcrypt from 'bcrypt';
import moment from 'moment';
import User from '../../models/user.js';
import PasswordResetToken from '../../models/passwordResetToken.js';
import Logs from '../../models/Logs.js'; 

export const passwordReset = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Log request details
        await Logs.create({
            userId: null, 
            action: `Password reset request: token=${token}`,
            logTime: new Date(),
        });

        // Validate the token
        const tokenRecord = await PasswordResetToken.findOne({
            where: { token }
        });

        if (!tokenRecord) {
            await Logs.create({
                userId: null,
                action: `Password reset failed: Invalid token`,
                logTime: new Date(),
            });
            return res.status(400).send({ message: 'Invalid token' });
        }

        const { userId, expiryDate } = tokenRecord;
        if (moment().isAfter(expiryDate)) {
            await Logs.create({
                userId: null,
                action: `Password reset failed: Token expired`,
                logTime: new Date(),
            });
            return res.status(400).send({ message: 'Token expired' });
        }

        // Update the user password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await User.update(
            { password: hashedPassword },
            { where: { id: userId } }
        );

        // Remove the token after successful password reset
        await PasswordResetToken.destroy({ where: { token } });

        // Log successful password reset
        await Logs.create({
            userId,
            action: `Password successfully reset`,
            logTime: new Date(),
        });

        res.status(200).send({ message: 'Password successfully reset' });
    } catch (err) {
        // Log error
        await Logs.create({
            userId: null,
            action: `Password reset error: ${err.message}`,
            logTime: new Date(),
            details: err.stack,
        });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
