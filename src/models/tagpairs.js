'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class TagPairs extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    TagPairs.init(
        {
            uuid: DataTypes.UUID,
            tag: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: 'TagPairs',
        }
    );
    return TagPairs;
};
