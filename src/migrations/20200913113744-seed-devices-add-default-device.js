'use strict';

// We shall use migrations instead of seeders so umzug can automatically
// apply these on startup.

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkInsert('Devices', [
            {
                id: 0,
                name: 'default',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        // No need to revert this.
    },
};
