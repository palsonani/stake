import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js'; 
import uuid4 from 'uuid4';

class Chat extends Model {
    // You can add custom methods or hooks here if needed
}

Chat.init({
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    taggedUserId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,  
        allowNull: false
    }
}, {
    sequelize,  
    modelName: 'chats',  
    tableName: 'chats', 
    timestamps: false  
});

export default Chat;
