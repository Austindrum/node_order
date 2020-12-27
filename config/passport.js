const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const db = require("../models");
const User = db.User;

passport.use(new LocalStrategy(
    {
        usernameField: "work_id",
        passwordField: "password",
        passReqToCallback: true
    },
    (req, username, password, done) => {
    User.findOne({ where: { work_id: username } })
    .then(user=>{
        if(!user) {
            if(req.cookies.i18n === "en"){
                return done(null, false, req.flash("error_message", "User Not Find!"));
            }else{
                return done(null, false, req.flash("error_message", "無此使用者"));
            }
        }
        return bcrypt.compare(password, user.password)
        .then(isMatch => {
            if(!isMatch) {
                if(req.cookies.i18n === "en"){
                    return done(null, false, req.flash("error_message", "Password inccorect"));
                }else{
                    return done(null, false, req.flash("error_message", "密碼錯誤"));
                }
            }
            return done(null, user)
        })
        .catch(err => console.log(err))
    })
    .catch(err => done(err, false))
}))

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((id, done)=>{
    User.findByPk(id)
    .then((user)=>{
        user = user.toJSON();
        done(null, user)
    })
    .catch(err => done(err, null))
})

module.exports = passport;