const jwt = require("jsonwebtoken");
const SECRETKEY = require("./config").SECRETKEY;

function auth(req, rep, done) {
    if(req.cookies&&req.cookies.token) {
        try {
            const user = jwt.verify(req.cookies.token, SECRETKEY);
            req.user = user;
            done();
        } catch (error) {
            return rep.redirect("/login");
        }
    } else {
        return rep.redirect("/login");
    }
}

module.exports = auth;
