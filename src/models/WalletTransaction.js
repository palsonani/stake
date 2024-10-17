import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';

class WalletTransaction extends Model { }

WalletTransaction.init({
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
        type: DataTypes.DECIMAL(15, 2)
    },
    transactionType: {
        type: DataTypes.STRING(50)
    },
    transactionDirection: {
        type: DataTypes.ENUM('credit', 'debit')
    },
    description: {
        type: DataTypes.STRING(255)
    },
    transactionTime: {
        type: DataTypes.DATE  
    }
}, {
    sequelize,
    modelName: 'wallettransaction',
    tableName: 'wallettransaction',
    timestamps: false
});

export default WalletTransaction;