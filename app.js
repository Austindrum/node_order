const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("./config/passport");
const methodOverride = require('method-override')

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'))
app.use(session({
    secret: "Austin",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next)=>{
    res.locals.success_message = req.flash("success_message");
    res.locals.warning_message = req.flash("warning_message");
    res.locals.error_message = req.flash("error_message");
    res.locals.user = req.user;
    next();
})

require("./routes")(app);
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
    console.log(`Server Start on Port ${PORT}`);
})