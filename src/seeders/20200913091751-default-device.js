'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add seed commands here.
        const device = await queryInterface.bulkInsert('Devices', [
            {
                id: 0,
                name: 'unknown',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        // Add commands to revert seed here.
        await queryInterface.bulkDelete('Devices', null, {});
    },
};
