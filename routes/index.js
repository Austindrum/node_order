const db = require("../models");
const moment =require("moment");
const User = db.User;
const Date = db.Date;
const Meal = db.Meal;
const Order = db.Order;
const OrderMeal = db.OrderMeal;
const url = require('url');
const passport = require("../config/passport");
// get date meals
async function getDateMeals(targetDate, userId, res){
    let target = await Date.findAll({
        raw: true,
        nest: true,
        where: { date: targetDate },
    })
    let dateId = target[0].id;
    let datemeals = await Date.findByPk(dateId, {
        include: [{
            model: Meal,
            as: "meal"
        }]
    })
    let orderedInfo = await User.findByPk(userId, {
        include: [
            { 
                model: Order,
                include: [
                    { model: Meal, as: "meal" }
                ]
            }
        ]
    }).then(user => {
        return user.toJSON().Orders.filter(order => order.date === targetDate);
    })
    const meals = datemeals.toJSON().meal;
    const date = datemeals.toJSON().date;
    return res.render("order", { meals, date, orderedInfo});
}

module.exports = (app) => {
    app.get("/", (req, res)=>{
        res.redirect("/order");
    })
    app.get("/signin", (req, res)=>{
        return res.render("signin");
    })
    app.post("/signin", 
    passport.authenticate('local', {
        failureRedirect: "signin",
        failureFlash: true,
    }), 
    (req, res)=>{
        return res.redirect("/");
    })
    app.get("/user", (req, res)=>{
        return res.render("profile");
    })
    app.get("/history", async (req, res)=>{
        let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        await User.findByPk(req.user.id, {
            include: [
                {
                    model: Order,
                    include: [
                        { 
                            model: Meal,
                            as: "meal"
                        }
                    ]
                }
            ]
        }).then(user=>{
            let current_url = new URL(fullUrl);
            let searchEmpty = current_url.search === "";
            let orders = user.toJSON().Orders;
            let data = [];
            let targetDay = "";
            if(searchEmpty){
                let today = moment().format().slice(0, 10);
                data = orders.filter(order => order.date === today);
                targetDay = today;
            }else{
                let year = current_url.searchParams.get("year");
                let month = current_url.searchParams.get("month");
                let date = current_url.searchParams.get("date");
                if(month === ""){   
                    data = orders.filter(order => {
                        return order.date.split("-")[0] === year;
                    })
                    targetDay = year;
                    return res.render("history", { data, targetDay });
                }
                if(date === ""){
                    data = orders.filter(order => {
                        let dydm = order.date.split("-")[0] + "-" + order.date.split("-")[1];
                        let sysm = year + "-" + month;
                        return dydm === sysm;
                    })
                    targetDay = year + "-" + month;
                }
                if(year && month && date){
                    data = orders.filter(order => {
                        return order.date === year + "-" + month + "-" + date;
                    })
                    targetDay = year + "-" + month + "-" + date;
                }
            }
            return res.render("history", { data, targetDay });
        })
        .catch(err => console.log(err))
    })
    app.get("/order/:date", (req, res)=>{
        getDateMeals(req.params.date, req.user.id, res)
    })
    app.get("/order", (req, res) => {
        let today = moment().format().slice(0, 10);
        getDateMeals(today, req.user.id, res)
    });
    app.post("/order", async (req, res)=>{
        if(req.body.breakfast || req.body.dinner || req.body.midnight){
            await Order.create({
                UserId: req.user.id,
                date: req.body.date
            }).then(async order=>{
                if(req.body.breakfast) await OrderMeal.create({ OrderId: order.id, MealId: req.body.breakfast });
                if(req.body.dinner) await OrderMeal.create({ OrderId: order.id, MealId: req.body.dinner });
                if(req.body.midnight) await OrderMeal.create({ OrderId: order.id, MealId: req.body.midnight });
            })
        }
        return res.redirect(`/order/${req.body.date}`);
    })
    app.put("/order", async (req, res)=>{
        if(req.body.breakfast || req.body.dinner || req.body.midnight){
            OrderMeal.destroy({
                where: {
                    OrderId: req.body.orderId
                }
            })
            .then(async ()=>{
                if(req.body.breakfast) await OrderMeal.create({ OrderId: req.body.orderId, MealId: req.body.breakfast });
                if(req.body.dinner) await OrderMeal.create({ OrderId: req.body.orderId, MealId: req.body.dinner });
                if(req.body.midnight) await OrderMeal.create({ OrderId: req.body.orderId, MealId: req.body.midnight });
            })
            .then(()=>{
                return res.redirect(`/order/${req.body.date}`);
            })
        }
    })
    app.delete("/order", async (req, res)=>{
        await OrderMeal.destroy({
            where: {
                OrderId: req.body.orderId
            }
        });
        await Order.destroy({
            where: {
                id: req.body.orderId
            }
        });
        return res.redirect(`/order/${req.body.date}`);
    })
}