const jwt = require('jsonwebtoken');
const constants = require('./constants');

module.exports = function (req, res, next) {
    if (typeof req.headers.authorization !== "undefined" && req.headers.authorization && req.headers.authorization.indexOf('Bearer') !== -1) {
        let token = req.headers.authorization.split(" ")[1];
        
        jwt.verify(token, constants.jwtSecretKey, { algorithm: "HS256" }, (err, user) => {
            if (err) {
                res.locals.uid = null;
                return next();
            } else {
                res.locals.uid = user.id;

                return next();
            }
        });
    } else {
        res.locals.uid = null;
        return next();
    }
}