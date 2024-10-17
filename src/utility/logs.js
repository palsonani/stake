import Logs from "../models/Logs.js";

export const addLog = async (userId, userName, actionType, actionDescription, performOn = 'SELF', details = null) => {
    try {
        await Logs.create({
            userId,
            userName,
            actionType,
            actionDescription,
            logTime: new Date(),
            performOn
        });
    } catch (error) {
        console.error('Error logging action:', error);
    }
};