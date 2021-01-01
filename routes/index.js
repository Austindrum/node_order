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
const i18n = require("i18n");

// i18n config
i18n.configure({
    locales: ['en', 'zh'],
    directory: __dirname + "/locales",
    defaultLocale: 'zh',
    cookie: 'i18n'
})

// check is login for user
const authenticated = (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }else{
        if(req.cookies.i18n === "en"){
            req.flash("error_message", "Login First Please!");
        }else{
            req.flash("error_message", "請先登入");
        }
        return res.redirect("/signin");
    }
}

// check is login for admin
const authenticatedAdmin = (req, res, next) => {
    if(req.isAuthenticated()){
        if(req.user.id === 1){
            return next();
        }else{
            if(req.cookies.i18n === "en"){
                req.flash("warning_message", "Sorry, You aren't Admin");
            }else{
                req.flash("warning_message", "非管理員");
            }
            return res.redirect("/order");
        }
    }else{
        if(req.cookies.i18n === "en"){
            req.flash("error_message", "Login First Please!");
        }else{
            req.flash("error_message", "請先登入");
        }
        return res.redirect("/signin");
    }
}

// check is login to vist signin page
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
            include: [
                { model: Meal, as: "meal" }
            ]
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
        return res.render("order", { i18n: res, meals, date, overTime, orderedInfo, ordersDate});
    }else{
        const meals = [];
        const date = targetDate;
        const overTime = {
            breakfast: false,
            dinner: false,
            midnight: false
        };
        return res.render("order", { i18n: res, meals, date, overTime, orderedInfo, ordersDate});
    }

}

module.exports = (app) => {
    // i18n middleware to routes
    app.use(i18n.init);
    
    app.get('/zh', function (req, res) {
        res.cookie('i18n', 'zh');
        res.redirect('/signin')
    });
    
    app.get('/en', function (req, res) {
        res.cookie('i18n', 'en');
        res.redirect('/signin')
    });
    
    app.get("/", authenticatedAdmin, (req, res)=>{
        if(req.user.work_id === "P0000"){
            return res.redirect("/orderform");
        }else{
            return res.redirect("/order");
        }
    })
    // user login
    app.get("/signin", isLogin, (req, res)=>{
        const lang = req.cookies.i18n;
        return res.render("signin", { i18n: res, lang });
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
                if(req.cookies.i18n === "en"){
                    req.flash("warning_message", "First Login! Suggest Change Your Password!");  
                }else{
                    req.flash("warning_message", "第一次登入請修改密碼");
                }
                return res.redirect("/user");
            }else{
                if(req.cookies.i18n === "en"){
                    req.flash("success_message", "Login Success");    
                }else{
                    req.flash("success_message", "登入成功");
                }
                return res.redirect("/order");
            }
        }
    })

    // user edit password
    app.get("/user", authenticated, (req, res)=>{
        return res.render("profile", { i18n: res });
    })
    app.put("/user", authenticated, (req, res)=>{
        const currentPassword = req.body.current_password;
        const newPassword = req.body.new_password;
        User.findByPk(req.user.id)
        .then( async user=>{
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if(!isMatch) {
                if(req.cookies.i18n === "en"){
                    req.flash("error_message", "登入密碼錯誤");
                }else{
                    req.flash("error_message", "Password Incorrect");
                }
                return res.redirect("/user");
            }else{
                user.update({
                    password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10), null),
                    isFirstLogin: false
                }).then(()=>{
                    if(req.cookies.i18n === "en"){
                        req.flash("success_message", "User Update Success");
                    }else{
                        req.flash("success_message", "更新成功");
                    }
                    return res.redirect("/order");
                })
                .catch(err=>console.log(err))
            }
        })
        .catch(err=>console.log(err))
    })

    // user history
    app.get("/history", authenticated, async (req, res)=>{
        const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        await User.findByPk(req.user.id, {
            include: [
                {
                    model: Order,
                    include: [
                        { model: Meal, as: "meal" }
                    ]
                }
            ]
        }).then(user=>{
            const current_url = new URL(fullUrl);
            const searchEmpty = current_url.search === "";
            const orders = user.toJSON().Orders;
            const today = moment().format().slice(0, 10);
            let data = [];
            let targetDay = "";
            // user history today
            if(searchEmpty){
                data = orders.filter(order => order.date === today);
                targetDay = today;
                return res.render("history", { i18n: res, data, targetDay });
            // user history target date
            }else{
                const from = current_url.searchParams.get("from");
                const to = current_url.searchParams.get("to");
                if(!from && !to){
                    return res.render("history", { i18n: res, data, targetDay });
                }
                if(from && !to){
                    data = orders.filter(order => from === order.date);
                    targetDay = from;
                    return res.render("history", { i18n: res, data, targetDay });
                }
                if(!from && to){
                    return res.render("history", { i18n: res, data, targetDay });
                }
                if(from && to){
                    data = orders.filter(order => moment(order.data).isBetween(from, to));
                    data.sort((a, b)=>{
                        return moment(a.date) - moment(b.date);
                    })
                    targetDay = `${from} ~ ${to}`;
                    return res.render("history", { i18n: res, data, targetDay });
                }
            }
        })
        .catch(err => console.log(err))
    })
    
    // user order CRUD
    app.get("/order/:date", authenticated, (req, res)=>{
        getDateMeals(req.params.date, req.user.id, res)
    })
    app.get("/order", authenticated, (req, res) => {
        const today = moment().format().slice(0, 10);
        getDateMeals(today, req.user.id, res)
    });
    app.post("/order", authenticated, async (req, res)=>{
        if(req.body.breakfast || req.body.dinner || req.body.midnight){
            await Order.create({
                UserId: req.user.id,
                date: req.body.date
            })
            .then(async order=>{
                if(req.body.breakfast) await OrderMeal.create({ OrderId: order.id, MealId: req.body.breakfast });
                if(req.body.dinner) await OrderMeal.create({ OrderId: order.id, MealId: req.body.dinner });
                if(req.body.midnight) await OrderMeal.create({ OrderId: order.id, MealId: req.body.midnight });
            })
            .then(()=>{
                if(req.cookies.i18n === "en"){
                    req.flash("success_message", "Order Create Success");
                }else{
                    req.flash("success_message", "訂單建立成功");
                }
                return res.redirect(`/order/${req.body.date}`);
            })
            .catch(err=>console.log(err))
        }else{
            if(req.cookies.i18n === "en"){
                req.flash("success_message", "Please Select An Meal");
            }else{
                req.flash("success_message", "請選擇餐點");
            }
            return res.redirect(`/order/${req.body.date}`);
        }
    })
    app.put("/order", authenticated, async (req, res)=>{
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
            if(req.cookies.i18n === "en"){
                req.flash("success_message", "Edit Success");
            }else{
                req.flash("success_message", "更新成功");
            }
            return res.redirect(`/order/${req.body.date}`);
        })
        .catch(err => console.log(err))
    })
    app.delete("/order", authenticated, async (req, res)=>{
        await OrderMeal.destroy({
            where: {
                OrderId: req.body.orderId
            }
        })
        .catch(err=>console.log(err));
        await Order.destroy({
            where: {
                id: req.body.orderId
            }
        })
        .catch(err=>console.log(err));
        if(req.cookies.i18n === "en"){
            req.flash("error_message", "Delete Success");
        }else{
            req.flash("error_message", "刪除成功");
        }
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
    app.get("/adduser", authenticatedAdmin, (req, res)=>{
        return res.render("admin/adduser");
    })
    app.post("/adduser", authenticatedAdmin, async (req, res)=>{
        const userIds = req.body.id;
        const passwords = req.body.password;
        userIds.forEach( async(userId, index)=>{
            await User.create({
                work_id: userId,
                password: bcrypt.hashSync(passwords[index], bcrypt.genSaltSync(10), null),
                isFirstLogin: true
            })
        })
        return res.redirect("/adduser");
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
        async function createDateMeals(dateId){
            if(req.body.breakfastName[0] !== ""){
                req.body.breakfastName.forEach( async(b, i)=>{
                    await Meal.create({
                        name: b,
                        en_name: req.body.breakfastEnName[i],
                        price: parseInt(req.body.breakfastPrice[i]),
                        type: "b"
                    }).then(async meal=>{
                        await DateMeal.create({
                            DateId: dateId,
                            MealId: meal.toJSON().id
                        })
                    })
                })
            }
            if(req.body.dinnerName[0] !== ""){
                req.body.dinnerName.forEach( async(d, i)=>{
                    await Meal.create({
                        name: d,
                        en_name: req.body.dinnerEnName[i],
                        price: parseInt(req.body.dinnerPrice[i]),
                        type: "d"
                    }).then(async meal=>{
                        await DateMeal.create({
                            DateId: dateId,
                            MealId: meal.toJSON().id
                        })
                    })
                })
            }
            if(req.body.midnightName[0] !== ""){
                req.body.midnightName.forEach( async(m, i)=>{
                    await Meal.create({
                        name: m,
                        en_name: req.body.midnightEnName[i],
                        price: parseInt(req.body.midnightPrice[i]),
                        type: "m"
                    }).then(async meal=>{
                        await DateMeal.create({
                            DateId: dateId,
                            MealId: meal.toJSON().id
                        })
                    })
                })
            }
        }
        const hadDate = await Date.findAll({
            raw: true,
            nest: true,
            where: { date: req.body.date }
        }).then(date => date);

        const targetDate = req.body.date;

        if(hadDate.length > 0){
            createDateMeals(hadDate[0].id);
        }else{
            const date = await Date.create({
                date: req.body.date
            }).then(date => date.toJSON());
            createDateMeals(date.id);
        }
        return res.redirect(`/meals/${targetDate}`);
    })
    app.get("/logout", (req, res)=>{
        req.logout();
        if(req.cookies.i18n === "en"){
            req.flash("success_message", "Logout Success");
        }else{
            req.flash("success_message", "登出成功");
        }
        res.redirect("/signin");
    })
    app.get("*", (req, res)=>{
        res.redirect("/");
    })
}