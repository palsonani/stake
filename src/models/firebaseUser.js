import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/connection.js'; 

class firebaseUser extends Model {}

firebaseUser.init({
    uid: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    displayName: {
        type: DataTypes.STRING
    },
    countryCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mobileNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    DOB: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    postalcode: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    occupation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    referralUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    referFrom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    // photoURL: {
    //     type: DataTypes.STRING
    // },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // Users are enabled by default
    }

    // Add any other fields you need
}, {
    sequelize,
    modelName: 'firebaseusers',
    tableName: 'firebaseusers',
    timestamps: true
});

export default firebaseUser;
