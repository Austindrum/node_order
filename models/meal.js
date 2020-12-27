'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Meal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Meal.belongsToMany(models.Date, {
        as: "date",
        through: {model: models.DateMeal},
        foreignKey: "MealId"
      });
      Meal.belongsToMany(models.Order, {
        as: "order",
        through: { model: models.OrderMeal },
        foreignKey: "MealId"
      })
    }
  };
  Meal.init({
    name: DataTypes.STRING,
    en_name: DataTypes.STRING,
    price: DataTypes.INTEGER,
    type: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Meal',
  });
  return Meal;
};