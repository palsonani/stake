import firebase from "../../utility/firebase.js";
import Logs from '../../models/Logs.js'; 

const generateOtp = async (phoneNumber) => {
    const recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
    return firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
        .then((confirmationResult) => {
            // SMS sent. Prompt user to type the code.
            return confirmationResult;
        })
        .catch((error) => {
            console.error("Error during signInWithPhoneNumber", error);
            throw error;
        });
};

export const sendOtp = async (req, res) => {
    const phoneNumber = req.body.phoneNumber;

    try {
        // Log request details
        await Logs.create({
            userId: req.user ? req.user.id : null, // Assuming user is attached to the request
            action: `Send OTP request: phoneNumber=${phoneNumber}`,
            logTime: new Date(),
        });

        const confirmationResult = await generateOtp(phoneNumber);

        // Log successful OTP generation
        await Logs.create({
            userId: req.user ? req.user.id : null,
            action: `OTP sent successfully: phoneNumber=${phoneNumber}`,
            logTime: new Date(),
        });

        res.status(200).send({ success: true, confirmationResult });
    } catch (error) {
        // Log error
        await Logs.create({
            userId: req.user ? req.user.id : null,
            action: `Send OTP error: ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        res.status(500).send({ success: false, error: error.message });
    }
};
