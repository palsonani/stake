import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js'; 

class Withdraw extends Model {}

Withdraw.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    walletId: {
        type: DataTypes.BIGINT,
        references: {
            model: 'wallet',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    userId: {
        type: DataTypes.BIGINT,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    time: {
        type: DataTypes.DATE
    }
}, {
    sequelize,
    modelName: 'withdraws',
    tableName: 'withdraws',
    timestamps: false
});

export default Withdraw;