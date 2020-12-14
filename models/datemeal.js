'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DateMeal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  DateMeal.init({
    DateId: DataTypes.INTEGER,
    MealId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'DateMeal',
  });
  return DateMeal;
};