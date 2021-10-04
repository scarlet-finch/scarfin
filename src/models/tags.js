'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Tags extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Tags.init(
        {
            name: DataTypes.STRING,
            description: DataTypes.STRING,
            type: {
                type: DataTypes.ENUM,
                values: ['default', 'user-defined', 'script-defined', 'other'],
            },
        },
        {
            sequelize,
            modelName: 'Tags',
        }
    );
    return Tags;
};
