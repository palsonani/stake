import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';
import Games from './Games.js';

class Commission extends Model {}

Commission.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    gameId: {
        type: DataTypes.BIGINT,
        references: {
            model: 'games',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    commissionPercentage: {
        type: DataTypes.DECIMAL(5, 2)
    },
    startCommissionDate: { // Replaces commissionDate
        type: DataTypes.DATE
    },
    endCommissionDate: { // New field
        type: DataTypes.DATE
    },
    startTime: {
        type: DataTypes.TIME
    },
    endTime: {
        type: DataTypes.TIME
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'preactive'),
        allowNull: false,
        defaultValue: 'preactive'
    }
}, {
    sequelize,
    modelName: 'commissions',
    tableName: 'commissions',
    timestamps: true, // Enables `createdAt` and `updatedAt`
    createdAt: 'createdAt', // Optional: clarify field names
    updatedAt: 'updatedAt'
});

Commission.belongsTo(Games, { as: 'game', foreignKey: 'gameId' });

export default Commission;
