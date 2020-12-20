'use strict';
const faker = require("faker");
const bcrypt = require("bcryptjs");

function setDate(index) {
  let day = new Date();
  day.setDate(day.getDate() + index);
  return day.toISOString().slice(0, 10);  
}

function setType(){
  let type = Math.floor(Math.random() * 3) + 1;
  if(type === 1) return "b";
  if(type === 2) return "d";
  if(type === 3) return "m";
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    queryInterface.bulkInsert('Users', [
      {
        id: 0,
        work_id: "P1314",
        password: await bcrypt.hashSync("123", bcrypt.genSaltSync(10), null),
        isFirstLogin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 1,
        work_id: "P1234",
        password: await bcrypt.hashSync("123", bcrypt.genSaltSync(10), null),
        isFirstLogin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        work_id: "P1000",
        password: await bcrypt.hashSync("123", bcrypt.genSaltSync(10), null),
        isFirstLogin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        work_id: "P0000",
        password: await bcrypt.hashSync("123", bcrypt.genSaltSync(10), null),
        isFirstLogin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        work_id: "P1111",
        password: await bcrypt.hashSync("123", bcrypt.genSaltSync(10), null),
        isFirstLogin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        work_id: "P2222",
        password: await bcrypt.hashSync("123", bcrypt.genSaltSync(10), null),
        isFirstLogin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
    queryInterface.bulkInsert("Shops", Array.from({ length: 3 }).map((item, index) => 
      ({
        id: index + 1,
        name: faker.company.companyName(),
        tel: faker.phone.phoneNumber(),
        address: faker.address.streetAddress(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ), {})
    queryInterface.bulkInsert('Meals', Array.from({ length: 40 }).map((item, index) =>
      ({
        id: index + 1,
        name: faker.commerce.productName(),
        price: faker.commerce.price(),
        type: setType(),
        ShopId: Math.floor(Math.random() * 3) + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ), {});
    queryInterface.bulkInsert('Dates', Array.from({ length: 60 }).map((item, index) =>
      ({
        id: index + 1,
        date: setDate(index),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ), {});
    return queryInterface.bulkInsert('DateMeals', Array.from({ length: 200 }).map((item, index) =>
      ({
        id: index + 1,
        DateId: Math.floor(Math.random() * 60)+1,
        MealId: Math.floor(Math.random() * 20)+1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
  ), {});
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.bulkDelete('Users', null, {});
    queryInterface.bulkDelete('Shops', null, {});
    queryInterface.bulkDelete('Meals', null, {});
    queryInterface.bulkDelete('Dates', null, {});
    return queryInterface.bulkDelete('DateMeals', null, {});
  }
};
