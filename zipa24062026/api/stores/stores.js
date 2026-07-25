const fs = require('fs');
const ObjectID = require('../objectid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const fetch = require('node-fetch');
const sendMail = require('../sendMail');

let db;
const dbConnect = require('../db');

dbConnect()
    .then((conn) => {
        db = conn;
    })
    .catch((e) => {
        console.log('DB error')
    })

class StoresModule {
    constructor(props) {

    }

    async promotedStores() {
        let stores = await db.collection('stores').find({ isVisible: true, isPromoted: true }, { projection: { alias: 1, profilePhoto: 1 } }).toArray();
        return stores;
    }

    async stores(page = 0, letter = null, search = null) {
        let query = {};


        if (search) {
            query.name = new RegExp(search, 'i');
        }
        if (letter) {
            query.name = new RegExp(`^${letter}`, 'i');
        }


        let items = await db.collection('stores').find(query, { projection: { name: 1, alias: 1, profilePhoto: 1 } }).skip(page * 48).limit(48).toArray();
        for (let i = 0; i < items.length; i++) {
            items[i].articleCount = await db.collection('products').find({ isVisible: true, storeId: items[i]._id }).count();
        }
        return {
            items: items,
            total: Math.ceil(await db.collection('stores').find(query).count() / 48)
        };
    }



    async createStore(store) {
        let storeObj = {
            _id: ObjectID(),
            alias: store.alias,
            name: store.name,
            region: store.region,
            city: store.city,
            address: store.address,
            phoneNumber: store.phoneNumber,
            webSite: store.webSite,
            aboutUs: store.aboutUs,
            isVisible: store.isVisible,
            isPromoted: store.isPromoted,
            profilePhoto: store.profilePhoto,
            coverPhoto: store.coverPhoto
        }

        let userObj = {
            _id: ObjectID(),
            email: store.adminEmail,
            pk: bcrypt.hashSync(store.adminPassword, bcrypt.genSaltSync(10)),
            emailVerified: true,
            registerTimestamp: Math.floor(new Date().getTime() / 1000),
            permissions: [
                'store-update',
                'store-contacts',
                'store-orders',
                'store-products',
                'store-statistics',
                'store-admins',
                'upload'
            ],
            storeId: storeObj._id
        }

        await db.collection('stores').insertOne(storeObj);
        await db.collection('users').insertOne(userObj);

        return {
            response: {},
            status: 200
        }
    }

    async updateStore(uid, storeAlias, store) {
        let storeCheck = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!storeCheck.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && storeCheck[0]._id && user[0].storeId.toString() == storeCheck[0]._id.toString())) {


            let storeObj = {
                name: store.name,
                region: store.region,
                city: store.city,
                address: store.address,
                phoneNumber: store.phoneNumber,
                webSite: store.webSite,
                aboutUs: store.aboutUs,
                isVisible: store.isVisible,
                isPromoted: store.isPromoted,
                profilePhoto: store.profilePhoto,
                coverPhoto: store.coverPhoto,
                shippingVolume: parseFloat(store.shippingVolume),
                shippingWeight: parseFloat(store.shippingWeight),
                shippingPrice: parseFloat(store.shippingPrice),
                workingTime: store.workingTime,
                coords: store.coords
            };

            await db.collection('stores').updateOne({ _id: storeCheck[0]._id }, {
                $set: storeObj
            });

            return {
                response: {},
                status: 200
            }
        } else {
            return {
                response: {
                    error: 'Nemate ovlaštenja',
                },
                status: 401
            }

        }
    }


    async getStore(storeAlias) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (store.length) {
            return {
                response: store[0],
                status: 200
            };
        } else {
            return {
                status: 404,
                response: {
                    error: 'Radnja nije pronadjena'
                }
            };
        }
    }

    async statistics(uid, storeAlias) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!store.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();

        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && store[0]._id && user[0].storeId.toString() == store[0]._id.toString())) {
            let obj = {
                ordersCount: await db.collection('orders').find({storeId: store[0]._id}).count(),
                productsCount: await db.collection('products').find({storeId: store[0]._id}).count(),
                productsVisitCount: await db.collection('visits').find({storeId: store[0]._id}).count() 
            }

            console.log(obj);

            let today = new Date();
            today.setHours(0, 0, 0, 0);
    
            let todayTimestamp = Math.floor(today.getTime() / 1000);
    
            let days = [];
            for (let i = 6; i >= 0; i--) {
                days.push(
                    {
                        timestamp: todayTimestamp - i * 24 * 60 * 60,
                        count: await db.collection("visits").find({ storeId: store[0]._id, timestamp: { $gte: todayTimestamp - i * 24 * 60 * 60, $lt: todayTimestamp - i * 24 * 60 * 60 + 24 * 60 * 60 } }).count()
                    }
                )
            }
            console.log(obj);

    
            let hours = [];
            for (let i = 0; i < 24; i++) {
                hours.push(
                    {
                        timestamp: todayTimestamp + i * 60 * 60,
                        count: await db.collection("visits").find({ storeId: store[0]._id, timestamp: { $gte: todayTimestamp + i * 60 * 60, $lt: todayTimestamp + i * 60 * 60 + 60 * 60 } }).count()
                    }
                )
            }
            console.log(obj);

            obj.days = days;
            obj.hours = hours;
            obj.lastVisitedProducts = await db.collection('visits').find({storeId: store[0]._id}).limit(5).sort({timestamp: -1}).toArray();
            console.log(obj);

            return {
                response: obj,
                status: 200
            }

        } else {
            return {
                response: {
                    error: 'Nemate ovlaštenja',
                },
                status: 401
            }
        }
    }




    async fetchOrders(uid, storeAlias, page = 0, search = null) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!store.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        console.log(user[0].storeId, store[0]._id, typeof user[0].storeId, typeof store[0]._id)
        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && store[0]._id && user[0].storeId.toString() == store[0]._id.toString())) {

            let query = { storeId: store[0]._id };


            if (search) {
                query = { $and: [{ storeId: store[0]._id }, { $or: [] }] };
                query['$and'][1]['$or']['shippingAddress.name'] = new RegExp(search, 'i');
                query['$and'][1]['$or']['shippingAddress.address'] = new RegExp(search, 'i');
                query['$and'][1]['$or']['shippingAddress.city'] = new RegExp(search, 'i');
                query['$and'][1]['$or']['shippingAddress.phoneNumber'] = new RegExp(search, 'i');
            }


            let orders = await db.collection('orders').find(query).skip(page * 20).limit(20).toArray();
            return {
                items: orders,
                total: Math.ceil(await db.collection('orders').find(query).count() / 20)
            };
        } else {
            return {
                response: {
                    error: 'Nemate ovlaštenja',
                },
                status: 401
            }
        }
    }

    async fetchOrder(uid, storeAlias, id) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!store.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        console.log(user[0].storeId, store[0]._id, typeof user[0].storeId, typeof store[0]._id)
        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && store[0]._id && user[0].storeId.toString() == store[0]._id.toString())) {

            let query = { storeId: store[0]._id, _id: ObjectID(id) };

            let orders = await db.collection('orders').find(query).toArray();

            return orders[0];
        } else {
            return {
                response: {
                    error: 'Nemate ovlaštenja',
                },
                status: 401
            }
        }
    }

    async contact(storeAlias, obj) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!store.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        await db.collection('storeContacts').insertOne({
            storeId: store[0]._id,
            name: obj.name,
            email: obj.email,
            phoneNumber: obj.phoneNumber,
            message: obj.message,
            timestamp: Math.floor(new Date().getTime() / 1000)
        });

        return {
            response: {
                error: null
            },
            status: 200
        }

    }




    async setChargedStatus(uid, storeAlias, id, status) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!store.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        console.log(user[0].storeId, store[0]._id, typeof user[0].storeId, typeof store[0]._id)
        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && store[0]._id && user[0].storeId.toString() == store[0]._id.toString())) {


            await db.collection('orders').updateOne({ storeId: store[0]._id, _id: ObjectID(id) }, {
                $set: {
                    charged: status == '0' ? false : true
                }
            });

            return {
                response: {
                    error: null,
                },
                status: 200
            }

        } else {
            return {
                response: {
                    error: 'Nemate ovlaštenja',
                },
                status: 401
            }
        }
    }

    async setStatus(uid, storeAlias, id, status) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!store.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        console.log(user[0].storeId, store[0]._id, typeof user[0].storeId, typeof store[0]._id)
        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && store[0]._id && user[0].storeId.toString() == store[0]._id.toString())) {


            await db.collection('orders').updateOne({ storeId: store[0]._id, _id: ObjectID(id) }, {
                $set: {
                    status: status == '0' ? 'Na čekanju' : 'Poslato'
                }
            });

            return {
                response: {
                    error: null,
                },
                status: 200
            }

        } else {
            return {
                response: {
                    error: 'Nemate ovlaštenja',
                },
                status: 401
            }
        }
    }

    async setTrackingCode(uid, storeAlias, id, trackingCode) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!store.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        console.log(user[0].storeId, store[0]._id, typeof user[0].storeId, typeof store[0]._id)
        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && store[0]._id && user[0].storeId.toString() == store[0]._id.toString())) {


            await db.collection('orders').updateOne({ storeId: store[0]._id, _id: ObjectID(id) }, {
                $set: {
                    trackingCode: trackingCode
                }
            });

            let order = await db.collection('orders').find({storeId: store[0]._id, _id: ObjectID(id)}).toArray();
            if (order.length){
                if (order[0].uid){
                    let user = await db.collection('users').find({_id: ObjectID(order[0].uid)}).toArray();
                    if (user.length){
                        sendMail(user[0].email, 'Vaša pošiljka je poslata!', String.format(fs.readFileSync('./emails/trackingCode.html', 'utf-8'), `https://euroexpress.ba/praćenje-pošiljke/${trackingCode}`))
                    }

                }
            }

            return {
                response: {
                    error: null,
                },
                status: 200
            }

        } else {
            return {
                response: {
                    error: 'Nemate ovlaštenja',
                },
                status: 401
            }
        }
    }


    async deleteOrder(uid, storeAlias, id) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!store.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && store[0]._id && user[0].storeId.toString() == store[0]._id.toString())) {


            await db.collection('orders').deleteOne({ storeId: store[0]._id, _id: ObjectID(id) });

            return {
                response: {
                    error: null,
                },
                status: 200
            }

        } else {
            return {
                response: {
                    error: 'Nemate ovlaštenja',
                },
                status: 401
            }
        }
    }


    async fetchContacts(uid, storeAlias, page = 0, search = null) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!store.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        console.log(user[0].storeId, store[0]._id, typeof user[0].storeId, typeof store[0]._id)
        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && store[0]._id && user[0].storeId.toString() == store[0]._id.toString())) {

            let query = { storeId: store[0]._id };

            if (search) {
                query = {
                    $and: [{ storeId: store[0]._id }, {
                        $or: [
                            {
                                name: new RegExp(search, 'i')
                            },
                            {
                                phoneNumber: new RegExp(search, 'i')
                            },
                            {
                                email: new RegExp(search, 'i')
                            },
                        ]
                    }]
                };
            }

            let items = await db.collection('storeContacts').find(query).skip(page * 20).limit(20).toArray();
            return {
                items: items,
                total: Math.ceil(await db.collection('storeContacts').find(query).count() / 20)
            };
        } else {
            return {
                response: {
                    error: 'Nemate ovlaštenja',
                },
                status: 401
            }
        }
    }


    async deleteProduct(uid, storeAlias, id) {
        let store = await db.collection('stores').find({ alias: storeAlias }).toArray();
        if (!store.length) {
            return {
                status: 500,
                response: {
                    error: 'Radnja nije pronadjena.'
                }
            }
        }

        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && store[0]._id && user[0].storeId.toString() == store[0]._id.toString())) {


            await db.collection('products').deleteOne({ storeId: store[0]._id, _id: ObjectID(id) });

            return {
                response: {
                    error: null,
                },
                status: 200
            }

        } else {
            return {
                response: {
                    error: 'Nemate ovlaštenja',
                },
                status: 401
            }
        }
    }


}

module.exports = StoresModule;