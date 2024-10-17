import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';  

class Payment extends Model {
    // You can add custom methods or hooks here if needed
}

Payment.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    transactionId: {
        type: DataTypes.STRING,
        unique: true
    },
    userId: {
        type: DataTypes.BIGINT
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    method: {
        type: DataTypes.STRING(50)
    },
    status: {
        type: DataTypes.STRING(50)
    },
    metaId: {
        type: DataTypes.STRING(255)  // transaction id
    }
}, {
    sequelize,  
    modelName: 'payments',  
    tableName: 'payments',  
    timestamps: true  
});

export default Payment;
