import { DataTypes, Model } from 'sequelize';
import { sequelize } from "../config/connection.js";

class Kyc extends Model { }

Kyc.init({
    userId: {
        type: DataTypes.BIGINT,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    documentNumber: {
        type: DataTypes.STRING(255)
    },
    status: {
        type: DataTypes.TINYINT,
        defaultValue: 0
    },
    verifiedAt: {
        type: DataTypes.DATE
    }
}, {
    sequelize,
    modelName: 'kyc',
    tableName: 'kyc',
    timestamps: false
});

export default Kyc;