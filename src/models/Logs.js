import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js';

class Logs extends Model {}

Logs.init({
    logId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.STRING(255), 
    },
    userName: {
        type: DataTypes.STRING(255), 
    },
    performOn: {
        type: DataTypes.STRING(255), 
    },
    actionType: {
        type: DataTypes.STRING(100), 
    },
    actionDescription: {
        type: DataTypes.STRING(500), 
    },
    logTime: {
        type: DataTypes.DATE
    }
}, {
    sequelize,
    modelName: 'logs',
    tableName: 'logs',
    timestamps: false
});


export default Logs;
