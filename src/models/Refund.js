import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';  
class Refund extends Model {
    // You can add custom methods or hooks here if needed
}

Refund.init({
    paymentId: {
        type: DataTypes.BIGINT,
        references: {
            model: 'payments',  
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    reason: {
        type: DataTypes.STRING(255)
    },
    status: {
        type: DataTypes.STRING(50)
    }
}, {
    sequelize,  
    modelName: 'refunds',  
    tableName: 'refunds', 
    timestamps: true  
});

export default Refund;
