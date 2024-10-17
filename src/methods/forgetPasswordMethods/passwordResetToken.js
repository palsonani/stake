import uuid4 from "uuid4";
import moment from 'moment';
import User from "../../models/user.js";
import transporter from '../../utility/emailTransporter.js';
import PasswordResetToken from "../../models/passwordResetToken.js";
import Logs from '../../models/Logs.js'; 

export const passwordResetToken = async (req, res) => {
    const { email } = req.body;

    try {
        // Log request details
        await Logs.create({
            userId: null, 
            action: `Password reset token request: email=${email}`,
            logTime: new Date(),
        });

        // Check if the user exists
        const user = await User.findOne({ where: { email } });

        if (!user) {
            await Logs.create({
                userId: null,
                action: `Password reset token request failed: User not found`,
                logTime: new Date(),
            });
            return res.status(400).send('User not found');
        }

        const token = uuid4();
        const expiryDate = moment().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'); 

        // Store the token in the database
        await PasswordResetToken.create({
            userId: user.id,
            token: token,
            expiryDate: expiryDate
        });

        // Send email with reset link
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;
        await transporter.sendMail({
            from: 'palsonani02@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `To reset your password, click the following link: ${resetLink}`
        });

        // Log successful email send
        await Logs.create({
            userId: user.id,
            action: `Password reset email sent to ${email}`,
            logTime: new Date(),
        });

        res.status(200).send({ message: 'Password reset email sent', token });
    } catch (err) {
        // Log error
        await Logs.create({
            userId: null,
            action: `Password reset token error: ${err.message}`,
            logTime: new Date(),
            details: err.stack,
        });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
