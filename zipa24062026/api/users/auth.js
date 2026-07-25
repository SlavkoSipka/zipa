const jwt = require('jsonwebtoken');
const constants = require('./constants');
const dbConnect = require('../db');
const ObjectID = require('../objectid');
let db;

dbConnect()
    .then((conn) => {
        db = conn;
    })
    .catch((e) => {
        console.log('DB error')
    })


module.exports = (permission) => {
    return async (req, res, next) => {
        if (typeof req.headers.authorization !== "undefined" && req.headers.authorization && req.headers.authorization.indexOf('Bearer') !== -1) {
            let token = req.headers.authorization.split(" ")[1];
            jwt.verify(token, constants.jwtSecretKey, { algorithm: "HS256" }, (err, user) => {
               // console.log(err, user);
                if (err) {
                    res.status(401).json({ error: "Not Authorized" });
                    return;
                    //throw new Error("Not Authorized");
                }

                res.locals.uid = user.id;


                db.collection('users').find({ _id: ObjectID(user.id) }).toArray((err, result) => {
                    if (err) {
                        res.status(404).json({ error: "Not Found" });
                        return;
                    }

                    //console.log(result);

                    if (result && !result.length) {
                        res.status(404).json({ error: "Not Found" });
                        return;
                    }

                    if (result[0].permissions && result[0].permissions.indexOf('*') !== -1) {
                        return next();
                    }

                    if (!permission){
                        return next();
                    }

                    if (result[0].permissions && result[0].permissions.indexOf(permission) !== -1) {
                        return next();
                    }

                    res.status(401).json({ error: "Not Authorized" });
                    return;
                });
            });
        } else {
            res.status(401).json({ error: "Not Authorized" });
            return;
            //throw new Error("Not Authorized");
        }
    }
}