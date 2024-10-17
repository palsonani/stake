import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';

class AmountDistribution extends Model {}

AmountDistribution.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.BIGINT, 
        allowNull: false,
        references: {
            model:'users',
            key: 'id'
        }
    },
    gameId: {
        type: DataTypes.BIGINT, 
        allowNull: false,
        references: {
            model: 'games',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    }
}, {
    sequelize,
    modelName: 'amount_distributions',
    tableName: 'amount_distributions', 
    timestamps: true
});

export default AmountDistribution;
