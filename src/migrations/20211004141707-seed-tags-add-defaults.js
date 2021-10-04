'use strict';

// We shall use migrations instead of seeders so umzug can automatically
// apply these on startup.

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.bulkInsert('Tags', [
            {
                id: 0,
                name: 'for-guests',
                description: 'To show guests who come to visit',
                type: 'default',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 1,
                name: 'for-social',
                description: 'To upload on social media',
                type: 'default',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 2,
                name: 'to-delete',
                description: 'To be deleted',
                type: 'default',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 3,
                name: 'wallpapers',
                description: 'Wallpaper worthy',
                type: 'default',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 4,
                name: 'to-print',
                description: 'To print and hang etc',
                type: 'default',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    down: async (queryInterface, Sequelize) => {
        // No need to revert this.
    },
};
