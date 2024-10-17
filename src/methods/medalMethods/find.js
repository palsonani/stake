import Medal from "../../models/Medals.js";


export const getAllMedals = async (req, res) => {
    try {
        const medals = await Medal.findAll();
        res.status(200).json(medals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
