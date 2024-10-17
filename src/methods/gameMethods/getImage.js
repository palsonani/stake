import path from 'path';
import { fileURLToPath } from 'url';
import { addLog } from '../../utility/logs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getImage = async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../../uploads', filename);

        // Log the attempt to get the image
        await addLog(null, 'admin', 'INFO', `Attempt to retrieve image - Filename: ${filename}`);
+-
        res.sendFile(filePath, (err) => {
            if (err) {
                // Log the error if sending the file fails
                console.error(`Error sending file: ${err.message}`);
                addLog(null, 'admin', 'ERROR', `Error sending file - Filename: ${filename}, Error: ${err.message}`, 'SELF');
                res.status(404).json({ message: 'Image not found' });
            }
        });
    } catch (error) {
        // Log any synchronous errors
        console.error(`Error in getImage: ${error.message}`);
        await addLog(null, 'admin', 'ERROR', `Error in getImage function - Error: ${error.message}`, 'SELF');
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
