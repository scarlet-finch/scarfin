'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Images', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            uuid: {
                type: Sequelize.UUID,
                references: {
                    model: 'Files',
                    key: 'uuid',
                },
            },
            name: {
                type: Sequelize.STRING,
            },
            album: {
                type: Sequelize.STRING,
            },
            deviceId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Devices',
                    key: 'id',
                },
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
        await queryInterface.dropTable('Images');
    },
};
