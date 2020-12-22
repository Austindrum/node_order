const db = require("../models");
const moment =require("moment");
const User = db.User;
const Date = db.Date;
const DateMeal = db.DateMeal;
const Shop = db.Shop;
const Meal = db.Meal;
const Order = db.Order;
const OrderMeal = db.OrderMeal;
const passport = require("../config/passport");
const bcrypt = require("bcryptjs");

const authenticated = (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }else{
        req.flash("error_message", "Login First Please!");
        return res.redirect("/signin");
    }
}

const authenticatedAdmin = (req, res, next) => {
    if(req.isAuthenticated()){
        if(req.user.id === 3){
            return next();
        }else{
            req.flash("warning_message", "Sorry, You aren't Admin");
            return res.redirect("/order");
        }
    }else{
        req.flash("error_message", "Login First Please!");
        return res.redirect("/signin");
    }
}

const isLogin = (req, res, next) => {
    if(req.isAuthenticated()){
        if(req.user.id === 3){
            return res.redirect("/shops");
        }else{
            return res.redirect("/order");
        }
    }else{
        return next();
    }
}

// get date meals
async function getDateMeals(targetDate, userId, res){
    const orderedInfo = await User.findByPk(userId, {
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

    const ordersDate = await User.findByPk(userId, {
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

    const target = await Date.findAll({
        raw: true,
        nest: true,
        where: { date: targetDate },
    })

    if(target.length > 0){
        const dateId = target[0].id;
        const datemeals = await Date.findByPk(dateId, {
            include: [{
                model: Meal,
                as: "meal"
            }]
        })
        const meals = datemeals.toJSON().meal;
        const date = datemeals.toJSON().date;
        const dateTime = {
            breakfast: `${date}T20:29:59+08:00`,
            dinner: `${date}T16:29:59+08:00`,
            midnight: `${date}T20:29:59+08:00`
        };
        const overTime = {
            breakfast: moment(dateTime.breakfast).valueOf() < moment().valueOf(),
            dinner: moment(dateTime.dinner).valueOf() < moment().valueOf(),
            midnight: moment(dateTime.midnight).valueOf() < moment().valueOf(),
        }
        return res.render("order", { meals, date, overTime, orderedInfo, ordersDate});
    }else{
        const meals = [];
        const date = targetDate;
        const overTime = {
            breakfast: false,
            dinner: false,
            midnight: false
        };
        return res.render("order", { meals, date, overTime, orderedInfo, ordersDate});
    }

}

module.exports = (app) => {
    app.get("/", authenticatedAdmin, (req, res)=>{
        if(req.user.work_id === "P0000"){
            return res.redirect("/orderform");
        }else{
            return res.redirect("/order");
        }
    })
    app.get("/signin", isLogin, (req, res)=>{
        return res.render("signin");
    })
    app.post("/signin", isLogin,
    passport.authenticate('local', {
        failureRedirect: "signin",
        failureFlash: true,
    }),
    (req, res)=>{
        if(req.user.work_id === "P0000"){
            return res.redirect("/orderform");
        }else{
            if(req.user.isFirstLogin){
                req.flash("warning_message", "First Login! Suggest Change Your Password!");
                return res.redirect("/user");
            }else{
                req.flash("success_message", "Login Success");
                return res.redirect("/order");
            }
        }
    })
    app.get("/user", authenticated, (req, res)=>{
        return res.render("profile");
    })
    app.put("/user", authenticated, (req, res)=>{
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
    app.get("/history", authenticated, async (req, res)=>{
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
    app.get("/order/:date", authenticated, (req, res)=>{
        getDateMeals(req.params.date, req.user.id, res)
    })
    app.get("/order", authenticated, (req, res) => {
        let today = moment().format().slice(0, 10);
        getDateMeals(today, req.user.id, res)
    });
    app.post("/order", authenticated, async (req, res)=>{
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
    app.put("/order", authenticated, async (req, res)=>{
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
    app.delete("/order", authenticated, async (req, res)=>{
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

    // ADMIN
    app.get("/shops", authenticatedAdmin, async(req, res)=>{
        const shops = await Shop.findAll({
            raw: true,
            nest: true
        })
        res.render("admin/shops", { shops });
    })
    app.get("/orderform", authenticatedAdmin, async (req, res)=>{
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
    app.get("/meals/:date", authenticatedAdmin, async (req, res)=>{
        const date = req.params.date;
        let datemeals = await Date.findAll({
            raw: true,
            nest: true,
            where: {
                date: date,
            },
            include: [
                {
                    model: Meal,
                    as: "meal"
                }
            ]
        });
        const meals = datemeals.map(data=> data.meal );
        console.log(meals);
        return res.render("admin/meals", { meals, date });
    })
    app.get("/meals", authenticatedAdmin, async (req, res)=>{
        const date = moment().format().slice(0, 10);
        const datemeals = await Date.findAll({
            raw: true,
            nest: true,
            where: {
                date: date,
            },
            include: [
                {
                    model: Meal,
                    as: "meal"
                }
            ]
        });
        const meals = datemeals.map(data=> data.meal );
        return res.render("admin/meals", { meals, date });
    })
    app.post("/meals", async (req, res)=>{
        const date = await Date.create({
            date: req.body.date
        }).then(date => date.toJSON());
        if(req.body.breakfastName.length > 0){
            req.body.breakfastName.forEach( async(b, i)=>{
                await Meal.create({
                    name: b,
                    price: req.body.breakfastPrice[i],
                    type: "b"
                }).then(async meal=>{
                    await DateMeal.create({
                        DateId: date.id,
                        MealId: meal.toJSON().id
                    })
                })
            })
        }
        if(req.body.dinnerName.length > 0){
            req.body.dinnerName.forEach( async(d, i)=>{
                await Meal.create({
                    name: d,
                    price: req.body.dinnerPrice[i],
                    type: "d"
                }).then(async meal=>{
                    await DateMeal.create({
                        DateId: date.id,
                        MealId: meal.toJSON().id
                    })
                })
            })
        }
        if(req.body.midnightName.length > 0){
            req.body.midnightName.forEach( async(m, i)=>{
                await Meal.create({
                    name: m,
                    price: req.body.midnightPrice[i],
                    type: "m"
                }).then(async meal=>{
                    await DateMeal.create({
                        DateId: date.id,
                        MealId: meal.toJSON().id
                    })
                })
            })
        }
        return res.redirect(`/meals/${date.date}`);
    })
    app.get("/logout", (req, res)=>{
        req.logout();
        res.redirect("/signin");
    })
    app.get("*", (req, res)=>{
        res.redirect("/");
    })
}