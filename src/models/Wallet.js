import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js'; 

class Wallet extends Model {}

Wallet.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.BIGINT,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    currencyType: {
        type: DataTypes.STRING(50)
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    currentAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    }
}, {
    sequelize,
    modelName: 'wallet',
    tableName: 'wallet',
    timestamps: false
});

export default Wallet;
