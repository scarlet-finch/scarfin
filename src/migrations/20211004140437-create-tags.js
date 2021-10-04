'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('tags', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            name: {
                type: Sequelize.STRING(127),
                allowNull: false,
                unique: true,
            },
            description: {
                type: Sequelize.STRING(1000),
            },
            type: {
                type: Sequelize.DataTypes.ENUM,
                values: ['default', 'user-defined', 'script-defined', 'other'],
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('tags');
    },
};
