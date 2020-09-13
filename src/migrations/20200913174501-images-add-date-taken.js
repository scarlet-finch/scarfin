'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
     await queryInterface.addColumn(
      'Images',
      'date_taken',
     Sequelize.DATE
    );
  },

  down: async (queryInterface, Sequelize) => {
     await queryInterface.removeColumn(
      'Images',
      'date_taken',
     Sequelize.DATE
    );
  }
};
