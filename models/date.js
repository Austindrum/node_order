'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Date extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Date.belongsToMany(models.Meal, {
        as: "meal",
        through: {model: models.DateMeal },
        foreignKey: "DateId"
      })
    }
  };
  Date.init({
    date: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Date',
  });
  return Date;
};