import firebase from "../../utility/firebase.js";
import Logs from '../../models/Logs.js'; 

const verify = async (confirmationResult, otp) => {
    return confirmationResult.confirm(otp)
        .then((result) => {
            // User signed in successfully.
            const user = result.user;
            return user;
        })
        .catch((error) => {
            console.error("Error during OTP verification", error);
            throw error;
        });
};

export const verifyOtp = async (req, res) => {
    const { confirmationResult, otp } = req.body;

    try {
        // Log request details
        await Logs.create({
            userId: req.user ? req.user.id : null, // Assuming user is attached to the request
            action: `Verify OTP request: otp=${otp}`,
            logTime: new Date(),
        });

        const user = await verify(confirmationResult, otp);

        // Log successful OTP verification
        await Logs.create({
            userId: req.user ? req.user.id : null,
            action: `OTP verified successfully: userId=${user.uid}`,
            logTime: new Date(),
        });

        res.status(200).send({ success: true, user });
    } catch (error) {
        // Log error
        await Logs.create({
            userId: req.user ? req.user.id : null,
            action: `Verify OTP error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(500).send({ success: false, error: error.message });
    }
};
