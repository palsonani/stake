import AmountDistribution from "../../models/AmountDistribution.js";

export const deleteAmountDistribution = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the distribution by ID
        const amountDistribution = await AmountDistribution.findByPk(id);
        if (!amountDistribution) {
            return res.status(404).json({ message: 'AmountDistribution not found.' });
        }

        // Delete the distribution
        await amountDistribution.destroy();
        res.status(200).json({ message: 'AmountDistribution deleted successfully.' });
    } catch (error) {
        console.error('Error deleting AmountDistribution:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
