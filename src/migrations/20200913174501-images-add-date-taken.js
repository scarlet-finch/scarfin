'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Images', 'dateTaken', Sequelize.DATE);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn(
            'Images',
            'dateTaken',
            Sequelize.DATE
        );
    },
};
