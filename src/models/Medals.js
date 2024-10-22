import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js'; 

class Medal extends Model {
    // Add custom methods or hooks if needed
}

Medal.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    medalType: {
        type: DataTypes.STRING(50),
        allowNull: false,  
    },
    medalLevel: {
        type: DataTypes.STRING(50),
        allowNull: false,  
    },
    winAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false  
    }
}, {
    sequelize,  
    modelName: 'medals',
    tableName: 'medals',  
    timestamps: true 
});

export default Medal;
