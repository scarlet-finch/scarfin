'use strict';

// DISASTROUS - DO NOT GO BACK FROM THIS MIGRATION

// No one is using scarfin for actual images yet so we can do
// a destructive migration like this. I'm just getting more
// familiar with the migration tools, but I don't preserve
// the actual data here; this just fixes the database structure.

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('TagPairs', 'tag', Sequelize.STRING);
        await queryInterface.addColumn('TagPairs', 'tag', Sequelize.INTEGER);
        await queryInterface.addConstraint('TagPairs', {
            fields: ['tag'],
            type: 'FOREIGN KEY',
            references: {
                table: 'Tags',
                field: 'id',
            },
            onDelete: 'no action',
            onUpdate: 'no action',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('TagPairs', 'tag', Sequelize.INTEGER);
        await queryInterface.addColumn('TagPairs', 'tag', Sequelize.STRING);
    },
};
