const db = require("../models");
const moment =require("moment");
const User = db.User;
const Date = db.Date;
const Meal = db.Meal;
const Order = db.Order;
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
            { model: Order }
        ]
    }).then(user => {
        return user.toJSON().Orders.filter(order => order.date === targetDate);
    })
    const meals = datemeals.toJSON().meal;
    const date = datemeals.toJSON().date;
    return res.render("order", { meals, date, orderedInfo});
}

async function getDateOrderMeal(data){
    const bm = await Meal.findByPk(data.bm);
    const dm = await Meal.findByPk(data.dm);
    const mm = await Meal.findByPk(data.mm);
    console.log(bm, dm, mm);
    // return { bm, dm, mm }
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
                {model: Order}
            ]
        }).then(user=>{
            const current_url = new URL(fullUrl);
            const searchEmpty = current_url.search === "";
            const orders = user.toJSON().Orders;
            let data = [];
            if(searchEmpty){
                const today = moment().format().slice(0, 10);
                data = orders.filter(order => order.date === today);
            }else{
                const year = current_url.searchParams.get("year");
                const month = current_url.searchParams.get("month");
                const date = current_url.searchParams.get("date");
                if(month === ""){   
                    data = orders.filter(order => {
                        return order.date.split("-")[0] === year;
                    })
                    console.log(data);
                    getDateOrderMeal(data);
                    return res.render("history");
                }
                if(date === ""){
                    data = orders.filter(order => {
                        const dydm = order.date.split("-")[0] + "-" + order.date.split("-")[1];
                        const sysm = year + "-" + month;
                        return dydm === sysm;
                    })
                }
                if(year && month && date){
                    data = orders.filter(order => {
                        return order.date === year + "-" + month + "-" + date;
                    })
                }
            }
            console.log(data);
            getDateOrderMeal(data);
            return res.render("history");
        })
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
                date: req.body.date,
                bmId: req.body.breakfast === "" ? null : parseInt(req.body.breakfast),
                dmId: req.body.dinner === "" ? null : parseInt(req.body.dinner),
                mmId: req.body.midnight === "" ? null : parseInt(req.body.midnight)
            })
        }
        return res.redirect(`/order/${req.body.date}`);
    })
    app.put("/order", async (req, res)=>{
        if(req.body.breakfast || req.body.dinner || req.body.midnight){
            await Order.findByPk(req.body.orderId)
            .then(order=>{
                order.update({
                    bmId: req.body.breakfast === "" ? null : parseInt(req.body.breakfast),
                    dmId: req.body.dinner === "" ? null : parseInt(req.body.dinner),
                    mmId: req.body.midnight === "" ? null : parseInt(req.body.midnight)
                })
                .then(()=>{
                    return res.redirect(`/order/${req.body.date}`);
                })
            })
        }
    })
    app.delete("/order", async (req, res)=>{
        await Order.findByPk(req.body.orderId)
        .then(order=>{
            order.destroy()
            .then(()=>{
                return res.redirect(`/order/${req.body.date}`);
            })
        })
    })
}