import { Op } from 'sequelize';
import Commission from '../../models/Commission.js';
import Games from '../../models/Games.js';
import { addLog } from '../../utility/logs.js';

export const addCommission = async (req, res) => {
    const { gameId, commissionPercentage, startTime, endTime, startCommissionDate, endCommissionDate } = req.body;
    const adminId = 'admin';
    const adminUserName = 'admin';

    // Validation checks
    if (!gameId) {
        await addLog(adminId, adminUserName, 'ADD_COMMISSION_FAILED', 'Game ID missing');
        return res.status(400).json({ success: false, message: 'Game ID is required' });
    }

    if (commissionPercentage === undefined) {
        await addLog(adminId, adminUserName, 'ADD_COMMISSION_FAILED', 'Commission percentage missing');
        return res.status(400).json({ success: false, message: 'Commission percentage is required' });
    }

    if (commissionPercentage < -100 || commissionPercentage > 100) {
        await addLog(adminId, adminUserName, 'ADD_COMMISSION_FAILED', 'Commission percentage out of range');
        return res.status(400).json({ success: false, message: 'Commission percentage must be between -100 and 100' });
    }

    if (!startTime) {
        await addLog(adminId, adminUserName, 'ADD_COMMISSION_FAILED', 'Start time missing');
        return res.status(400).json({ success: false, message: 'Start time is required' });
    }

    if (!endTime) {
        await addLog(adminId, adminUserName, 'ADD_COMMISSION_FAILED', 'End time missing');
        return res.status(400).json({ success: false, message: 'End time is required' });
    }

    if (!startCommissionDate || !endCommissionDate) {
        await addLog(adminId, adminUserName, 'ADD_COMMISSION_FAILED', 'Commission start or end date missing');
        return res.status(400).json({ success: false, message: 'Commission start and end dates are required' });
    }

    try {
        console.log(`Checking for existing commissions with gameId: ${gameId} and commission dates: ${startCommissionDate} - ${endCommissionDate}`);

        const startCommissionDateObj = new Date(startCommissionDate);
        const endCommissionDateObj = new Date(endCommissionDate);

        // Check for overlapping commissions
        const existingCommissions = await Commission.findAll({
            where: {
                gameId,
                [Op.or]: [
                    {
                        [Op.and]: [
                            { startTime: { [Op.lt]: endTime } },
                            { endTime: { [Op.gt]: startTime } }
                        ]
                    }
                ],
                [Op.or]: [
                    { startCommissionDate: { [Op.between]: [startCommissionDateObj, endCommissionDateObj] } },
                    { endCommissionDate: { [Op.between]: [startCommissionDateObj, endCommissionDateObj] } }
                ]
            }
        });

        if (existingCommissions.length > 0) {
            await addLog(adminId, adminUserName, 'ADD_COMMISSION_FAILED', 'Commission time and date overlap with an existing commission for this game');
            return res.status(400).json({ success: false, message: 'Commission time and date overlap with an existing commission for this game' });
        }

        const newCommission = await Commission.create({
            gameId,
            commissionPercentage,
            startTime,
            endTime,
            startCommissionDate: startCommissionDateObj,
            endCommissionDate: endCommissionDateObj
        });

        await addLog(adminId, adminUserName, 'ADD_COMMISSION_SUCCESS', `Commission added successfully: ${JSON.stringify(newCommission)}`);

        return res.status(201).json({
            success: true,
            message: 'Commission added successfully',
            data: newCommission
        });
    } catch (error) {
        console.error('Error adding commission:', error);
        await addLog(adminId, adminUserName, 'ADD_COMMISSION_ERROR', `Error adding commission: ${error.message}`, 'SELF', error.stack);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update an existing commission
export const updateCommission = async (req, res) => {
    const { id } = req.params;
    const { gameId, commissionPercentage, startTime, endTime, startCommissionDate, endCommissionDate } = req.body;
    const adminId = "admin";
    const adminUserName = "admin";

    if (!id) {
        await addLog(
            adminId,
            adminUserName,
            'UPDATE_COMMISSION_FAILED',
            'Commission update failed: Commission ID missing'
        );
        return res.status(400).json({
            success: false,
            message: 'Commission ID is required'
        });
    }

    try {
        const commission = await Commission.findByPk(id);

        if (!commission) {
            await addLog(
                adminId,
                adminUserName,
                'UPDATE_COMMISSION_FAILED',
                'Commission update failed: Commission not found'
            );
            return res.status(404).json({
                success: false,
                message: 'Commission not found'
            });
        }

        // Update the commission fields
        commission.gameId = gameId || commission.gameId;
        commission.commissionPercentage = commissionPercentage || commission.commissionPercentage;
        commission.startTime = startTime || commission.startTime;
        commission.endTime = endTime || commission.endTime;
        commission.startCommissionDate = startCommissionDate || commission.startCommissionDate;
        commission.endCommissionDate = endCommissionDate || commission.endCommissionDate;

        await commission.save();

        await addLog(
            adminId,
            adminUserName,
            'UPDATE_COMMISSION_SUCCESS',
            `Commission updated successfully: ${JSON.stringify(commission)}`
        );

        return res.status(200).json({
            success: true,
            message: 'Commission updated successfully',
            data: commission
        });
    } catch (error) {
        console.error('Error updating commission:', error);
        await addLog(
            adminId,
            adminUserName,
            'UPDATE_COMMISSION_ERROR',
            `Error updating commission: ${error.message}`,
            'SELF',
            error.stack
        );
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Fetch all commissions
export const getAllCommissions = async (req, res) => {
    const adminId = req.userId;
    const adminUserName = req.userName;

    try {
        let { page = 1, limit = 10 } = req.query;
        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit));
        const offset = (page - 1) * limit;

        if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
            await addLog(
                adminId,
                adminUserName,
                'FETCH_COMMISSIONS_FAILED',
                'Fetching commissions failed: Invalid pagination parameters'
            );
            return res.status(400).json({ message: "Invalid pagination parameters" });
        }

        const { rows: commissions, count: totalCommissions } = await Commission.findAndCountAll({
            limit,
            offset,
            include: [
                {
                    model: Games,
                    as: 'game',
                    attributes: ['id', 'gameName', 'gameType']
                }
            ]
        });

        if (!commissions.length) {
            await addLog(
                adminId,
                adminUserName,
                'FETCH_COMMISSIONS_SUCCESS',
                'No commissions found'
            );
            return res.status(200).json({
                success: true,
                message: 'No commissions found',
                data: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalCommissions: 0,
                    commissionsPerPage: limit
                }
            });
        }

        await addLog(
            adminId,
            adminUserName,
            'FETCH_COMMISSIONS_SUCCESS',
            `Commissions retrieved successfully: ${commissions.length} records found`
        );

        return res.status(200).json({
            success: true,
            message: 'Commissions retrieved successfully',
            data: commissions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCommissions / limit),
                totalCommissions,
                commissionsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error fetching commissions:', error);
        await addLog(
            adminId,
            adminUserName,
            'FETCH_COMMISSIONS_ERROR',
            `Error fetching commissions: ${error.message}`,
            'SELF',
            error.stack
        );
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Fetch all commissions by game ID
export const getAllCommissionsById = async (req, res) => {
    const { id } = req.params;
    let { page = 1, limit = 10 } = req.query;
    const adminId = req.userId;
    const adminUserName = req.userName;

    if (!id) {
        await addLog(
            adminId,
            adminUserName,
            'FETCH_COMMISSIONS_BY_ID_FAILED',
            'Fetching commissions by game ID failed: Game ID missing'
        );
        return res.status(400).json({
            success: false,
            message: 'Game ID is required'
        });
    }

    try {
        const game = await Games.findByPk(id);

        if (!game) {
            await addLog(
                adminId,
                adminUserName,
                'FETCH_COMMISSIONS_BY_ID_FAILED',
                'Fetching commissions by game ID failed: Game not found'
            );
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }

        page = Math.max(1, parseInt(page));
        limit = Math.max(1, parseInt(limit));
        const offset = (page - 1) * limit;

        if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
            await addLog(
                adminId,
                adminUserName,
                'FETCH_COMMISSIONS_BY_ID_FAILED',
                'Fetching commissions by game ID failed: Invalid pagination parameters'
            );
            return res.status(400).json({ message: "Invalid pagination parameters" });
        }

        await updateCommissionStatus();

        const { rows: commissions, count: totalCommissions } = await Commission.findAndCountAll({
            limit,
            offset,
            include: [
                {
                    model: Games,
                    as: 'game',
                    attributes: ['id', 'gameName', 'gameType'],
                    where: { id },
                }
            ]
        });

        if (!commissions || !commissions.length) {
            await addLog(
                adminId,
                adminUserName,
                'FETCH_COMMISSIONS_BY_ID_SUCCESS',
                'No commissions found for this game'
            );

            return res.status(200).json({
                success: true,
                message: 'No commissions found',
                data: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalCommissions: 0,
                    commissionsPerPage: limit
                }
            });
        }
        // Check if any commission has 'active' status
        const hasActiveCommission = commissions.some(commission => commission.status === 'active');
        console.log("hasActiveCommission", hasActiveCommission)
        if (!hasActiveCommission) {
            const defaultCommission = {
                commissionPercentage: 10, 
                startTime: "00:00:00",
                endTime: "23:59:59",
                startCommissionDate: new Date().toISOString().split('T')[0], 
                endCommissionDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], 
                status: 'active'
            };

            commissions.unshift(defaultCommission); 
        }

        await addLog(
            adminId,
            adminUserName,
            'FETCH_COMMISSIONS_BY_ID_SUCCESS',
            `Commissions retrieved successfully for game ID ${id}: ${commissions.length} records found`
        );

        return res.status(200).json({
            success: true,
            message: 'Commissions retrieved successfully',
            data: commissions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCommissions / limit),
                totalCommissions,
                commissionsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error fetching commissions by game ID:', error);
        await addLog(
            adminId,
            adminUserName,
            'FETCH_COMMISSIONS_BY_ID_ERROR',
            `Error fetching commissions by game ID: ${error.message}`,
            'SELF',
            error.stack
        );
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete a commission by ID
export const deleteCommission = async (req, res) => {
    const { id } = req.params;
    const adminId = req.userId;
    const adminUserName = req.userName;

    if (!id) {
        await addLog(
            adminId,
            adminUserName,
            'DELETE_COMMISSION_FAILED',
            'Commission deletion failed: Commission ID missing'
        );
        return res.status(400).json({
            success: false,
            message: 'Commission ID is required'
        });
    }

    try {
        const commission = await Commission.findByPk(id);

        if (!commission) {
            await addLog(
                adminId,
                adminUserName,
                'DELETE_COMMISSION_FAILED',
                'Commission deletion failed: Commission not found'
            );
            return res.status(404).json({
                success: false,
                message: 'Commission not found'
            });
        }

        await commission.destroy();

        await addLog(
            adminId,
            adminUserName,
            'DELETE_COMMISSION_SUCCESS',
            `Commission deleted successfully: ${id}`
        );

        return res.status(200).json({
            success: true,
            message: 'Commission deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting commission:', error);
        await addLog(
            adminId,
            adminUserName,
            'DELETE_COMMISSION_ERROR',
            `Error deleting commission: ${error.message}`,
            'SELF',
            error.stack
        );
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateCommissionStatus = async () => {
    try {
        const now = new Date();

        // Update commissions to 'inactive' if the end commission date has passed
        await Commission.update(
            { status: 'inactive' },
            {
                where: {
                    endCommissionDate: {
                        [Op.lt]: now
                    },
                    status: {
                        [Op.ne]: 'inactive'
                    }
                }
            }
        );

        // Update commissions to 'active' if the current date and time are within the commission date and time range
        await Commission.update(
            { status: 'active' },
            {
                where: {
                    startCommissionDate: {
                        [Op.lte]: now
                    },
                    endCommissionDate: {
                        [Op.gte]: now
                    },
                    startTime: {
                        [Op.lte]: now
                    },
                    endTime: {
                        [Op.gte]: now
                    },
                    status: {
                        [Op.ne]: 'inactive'
                    }
                }
            }
        );

        // Update commissions to 'preactive' if the current date and time are before the commission start date and time
        // and the status is not already 'inactive' or 'active'
        await Commission.update(
            { status: 'preactive' },
            {
                where: {
                    startCommissionDate: {
                        [Op.gt]: now
                    },
                    status: {
                        [Op.notIn]: ['inactive', 'active']
                    }
                }
            }
        );
    } catch (error) {
        console.error('Error updating commission statuses:', error);
    }
};
    