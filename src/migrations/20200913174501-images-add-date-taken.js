'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            await queryInterface.addColumn(
                'Images',
                'dateTaken',
                Sequelize.DATE
            );
        } catch (e) {
            // this is usually when the column already exists; its an issue with
            // the migration system.
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn(
            'Images',
            'dateTaken',
            Sequelize.DATE
        );
    },
};
