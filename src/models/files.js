'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Files extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Files.init(
        {
            path: DataTypes.STRING(10000),
            uuid: {
                type: DataTypes.UUID,
                unique: true,
            },
        },
        {
            sequelize,
            modelName: 'Files',
        }
    );
    return Files;
};
