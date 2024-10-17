import { addLog } from "../../utility/logs.js";

let lastRandomUsers = [];

export const updateRandomUsersOnPullCreation = async () => {
    try {
        const numberOfUsers = Math.floor(Math.random() * (200 - 5 + 1)) + 5;
        
        const users = [];
        const getRandomMultiplier = () => {
            return (Math.random() * (10 - 1.01) + 1.01).toFixed(2);
        };

        const getRandomAmount = () => {
            return (Math.random() * (10000 - 100) + 100).toFixed(2);
        };

        for (let i = 0; i < numberOfUsers; i++) {
            users.push({
                username: "hidden",
                multiplier: getRandomMultiplier(),
                amount: getRandomAmount(),
            });
        }

        lastRandomUsers = users;

        await addLog(null, 'admin', 'INFO', `Updated random users on pull creation. Total users: ${numberOfUsers}`);
    } catch (error) {
        await addLog(null, 'admin', 'ERROR', `Error updating random users on pull creation: ${error.message}`, 'SELF', error.stack);
        console.error('Error updating random users on pull creation:', error);
    }
};

export const getrendomUser = async (req, res) => {
    try {
        await addLog(null, 'admin', 'INFO', 'Fetched last generated random users');

        res.status(201).json({ message: 'Random User Data', users: lastRandomUsers });
    } catch (error) {
        await addLog(null, 'admin', 'ERROR', `Error fetching random users: ${error.message}`, 'SELF', error.stack);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
