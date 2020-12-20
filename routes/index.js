const db = require("../models");
const moment =require("moment");
const User = db.User;
const Date = db.Date;
const Meal = db.Meal;
const Order = db.Order;
const OrderMeal = db.OrderMeal;
const url = require('url');
const passport = require("../config/passport");
const bcrypt = require("bcryptjs");
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
    let ordersDate = await User.findByPk(userId, {
        include: [
            { 
                model: Order,
                include: [
                    { model: Meal, as: "meal" }
                ]
            }
        ]
    }).then(user=>{
        return user.toJSON().Orders.map(order => order.date);
    })
    const meals = datemeals.toJSON().meal;
    const date = datemeals.toJSON().date;
    return res.render("order", { meals, date, orderedInfo, ordersDate});
}

module.exports = (app) => {
    app.get("/", (req, res)=>{
        if(req.user.work_id === "P0000"){
            return res.redirect("/orderform");
        }else{
            return res.redirect("/order");
        }
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
        if(req.user.work_id === "P0000"){
            return res.redirect("/orderform");
        }else{
            if(req.user.isFirstLogin){
                req.flash("warning_message", "First Login! Suggest You Change Your Password!");
                return res.redirect("/user");
            }else{
                req.flash("success_message", "Login Success");
                return res.redirect("/order");
            }
        }
    })
    app.get("/user", (req, res)=>{
        return res.render("profile");
    })
    app.put("/user", (req, res)=>{
        const currentPassword = req.body.current_password;
        const newPassword = req.body.new_password;
        User.findByPk(req.user.id)
        .then( async user=>{
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if(!isMatch) {
                req.flash("error_message", "Password Incorrect");
                return res.redirect("/user");
            }else{
                user.update({
                    password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10), null),
                    isFirstLogin: false
                }).then(user=>{
                    req.flash("success_message", "User Update Success");
                    return res.redirect("/order");
                })
            }
        })
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
                let from = current_url.searchParams.get("from");
                let to = current_url.searchParams.get("to");
                if(!from && !to){
                    console.log("None Date");
                    return res.render("history", { data, targetDay });
                }
                if(from && !to){
                    data = orders.filter(order => from === order.date);
                    targetDay = from;
                    return res.render("history", { data, targetDay });
                }
                if(!from && to){
                    console.log("None From");
                    return res.render("history", { data, targetDay });
                }
                if(from && to){
                    data = orders.filter(order => moment(order.data).isBetween(from, to));
                    data.sort((a, b)=>{
                        return moment(a.date) - moment(b.date);
                    })
                    targetDay = `${from} ~ ${to}`;
                    return res.render("history", { data, targetDay });
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
        req.flash("success_message", "Order Create Success");
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
                req.flash("success_message", "Edit Success");
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
        req.flash("error_message", "Delete Success");
        return res.redirect(`/order/${req.body.date}`);
    })
    app.get("/orderform", async (req, res)=>{
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        let current_url = new URL(fullUrl);
        let searchEmpty = current_url.search === "";
        let orders = [];
        let targetDate = "";
        if(searchEmpty){
            const today = moment().format().slice(0, 10);
            orders = await Order.findAll({
                raw: true,
                nest: true,
                where: {
                    date: today
                },
                include: [
                    User,
                    {
                        model: Meal,
                        as: "meal",
                    }
                ]
            })
            targetDate = today;
        }else{
            const target = current_url.searchParams.get("date");
            orders = await Order.findAll({
                raw: true,
                nest: true,
                where: {
                    date: target
                },
                include: [
                    User,
                    {
                        model: Meal,
                        as: "meal",
                    }
                ]
            })
            targetDate = target;
        }
        return res.render("admin/orderform", { orders, targetDate });
    })
    app.get("/meals", async (req, res)=>{
        let data = await Meal.findAll({
            raw: true,
            nest: true
        });
        return res.render("admin/meals", { data });
    })
    app.get("/logout", (req, res)=>{
        req.logout();
        res.redirect("/signin");
    })
}