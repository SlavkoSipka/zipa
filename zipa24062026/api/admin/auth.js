const jwt = require('jsonwebtoken');
const constants = require('./constants');

module.exports = function(req, res, next) {
    if (typeof req.headers.authorization !== "undefined") {
        let token = req.headers.authorization.split(" ")[1];

        jwt.verify(token, constants.jwtSecretKey, { algorithm: "HS256" }, (err, user) => {
            console.log(user);
            if (err) {
                res.status(500).json({ error: "Not Authorized" });
                throw new Error("Not Authorized");
            }
            return next();
        });
    } else {
        res.status(500).json({ error: "Not Authorized" });
        throw new Error("Not Authorized");
    }
}