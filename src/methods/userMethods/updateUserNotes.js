import User from '../../models/user.js';
import Logs from '../../models/Logs.js';

export const updateUserNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        if (!notes) {
            return res.status(400).json({ message: "Notes field is required" });
        }

        // Find the user by ID
        const user = await User.findByPk(id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update the notes field
        user.notes = notes;
        await user.save();

        // Log the update
        await Logs.create({
            userId: id,
            action: `Updated notes for user with ID: ${id}`,
            logTime: new Date(),
            details: `New notes: ${notes}`,
        });

        res.status(200).json({
            message: "Notes updated successfully",
            user
        });
    } catch (error) {
        console.error(error);
        await Logs.create({
            userId: null,
            action: `Error updating notes for user with ID: ${id} - ${error.message}`,
            logTime: new Date(),
            details: error.stack,
        });
        return res.status(500).json({ error: 'Internal server error' });
    }
};
