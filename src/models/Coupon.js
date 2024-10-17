import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';

class Coupon extends Model { }

Coupon.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    isRedeemed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    redemptionDate: {
        type: DataTypes.DATE
    }
}, {
    sequelize,
    modelName: 'coupons',
    tableName: 'coupons',
    timestamps: true
});

export default Coupon;
