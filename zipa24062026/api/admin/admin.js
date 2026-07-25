const fs = require('fs');
const constants = require('./constants');
const ObjectID = require('../objectid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const fetch = require('node-fetch');
var webp = require('webp-converter');
var easyimage = require('easyimage');
const archiver = require('archiver');

let db;
const dbConnect = require('../db');
const exec = require('child_process').exec;
const { lstatSync, readdirSync } = require('fs')
const { join } = require('path')
const sendMail = require('../sendMail');
const { API_ENDPOINT } = require('../constants');


function generateAlias(str) {
    str = str.toLowerCase();
    str = str.replace(/ä/g, 'a');
    str = str.replace(/ö/g, 'o');
    str = str.replace(/ü/g, 'u');
    str = str.replace(/ß/g, 'b');
    str = str.replace(/č/g, 'c');
    str = str.replace(/ć/g, 'c');
    str = str.replace(/ž/g, 'z');
    str = str.replace(/đ/g, 'dj');
    str = str.replace(/š/g, 's');

    str = str.replace(/[^a-zA-Z0-9]/gi, '-').toLowerCase()
    str = str.replace(/-+/g, '-');

    return str;
}


const isDirectory = source => lstatSync(source).isDirectory()
const getDirectories = source =>
    readdirSync(source).map(name => join(source, name)).filter(isDirectory)

function zipDirectory(source, out) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', err => reject(err))
            .pipe(stream)
            ;

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

function mongoDump(filename) {

    return new Promise((resolve) => {
        exec(`mongodump --db zipa_db --gzip --archive=/zipa-data/backend/${filename}`, (err, stdout, stderr) => {
            console.log(stdout);

            console.log(stderr);
            resolve();
        })
    })
}


dbConnect()
    .then((conn) => {
        db = conn;
    })
    .catch((e) => {
        console.log('DB error')
    })
class Admin {
    constructor(props) {

    }

    async bannerClick(url) {
        await db.collection('bannerClicks').insertOne({ url: url, timestamp: Math.floor(new Date().getTime() / 1000) });
        return;
    }

    async statistics(from = null, to = null) {
        let res = {
            photosCount: 0,
            photographersCount: 0,
            todayEarnings: 0,
            yesterdayEarnings: 0,
            prevMonthEarnings: 0,
            currentMonthEarnings: 0,
            totalDownloads: await db.collection('downloads').countDocuments(),
            todayDownloads: 0,
            visitsPerDay: [],
            todayVisits: [],
            lastTransactions: [],
            photographers: [],
            bannerClicks: [],
            galleryVisits: []
        };

        let startTimestamp = from;
        let endTimestamp = to;

        res.photosCount = await db.collection('gallery').countDocuments({ isActive: true, userDisabled: { $ne: true } });

        res.photographersCount = await db.collection('users').countDocuments({ userRole: 'photographer', accountEnabled: true });

        let today = new Date();
        let todayTimestamp = new Date();
        todayTimestamp.setHours(0, 0, 0, 0);
        todayTimestamp = Math.floor(todayTimestamp.getTime() / 1000);

        let todayDownloads = await db.collection('downloads').countDocuments({ timestamp: { $gte: todayTimestamp, $lt: todayTimestamp + 24 * 60 * 60 } });
        res.todayDownloads = todayDownloads;

        res.todayEarnings = await this.calculateEarnings(todayTimestamp, todayTimestamp + 24 * 60 * 60);

        let yesterdayTimestamp = todayTimestamp - 24 * 60 * 60;
        res.yesterdayEarnings = await this.calculateEarnings(yesterdayTimestamp, todayTimestamp);

        let startOfMonth = new Date(todayTimestamp * 1000);
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        let startOfMonthTimestamp = Math.floor(startOfMonth.getTime() / 1000);
        res.currentMonthEarnings = await this.calculateEarnings(startOfMonthTimestamp, todayTimestamp + 24 * 60 * 60);

        let startOfPrevMonth = new Date(startOfMonth);
        startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
        let startOfPrevMonthTimestamp = Math.floor(startOfPrevMonth.getTime() / 1000);
        let endOfPrevMonthTimestamp = startOfMonthTimestamp;
        res.prevMonthEarnings = await this.calculateEarnings(startOfPrevMonthTimestamp, endOfPrevMonthTimestamp);

        let pipeline = [
            {
                $match: {
                    timestamp: { $gte: startTimestamp, $lte: endTimestamp }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: { $multiply: ["$timestamp", 1000] } } } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ];

        if (!from && !to) {
            const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const tenDaysAgo = new Date(todayMidnight);
            tenDaysAgo.setDate(tenDaysAgo.getDate() - 9);

            pipeline[0].$match.timestamp = { $gte: tenDaysAgo.getTime() / 1000, $lt: todayMidnight.getTime() / 1000 + 24 * 60 * 60 };
        }

        const visitsPerDay = await db.collection("logs").aggregate(pipeline).toArray();

        res.visitsPerDay = visitsPerDay.map(({ _id, count }) => ({ timestamp: new Date(_id).getTime() / 1000, count }));

        let todayVisits = await db.collection('logs').aggregate([
            { $match: { timestamp: { $gte: todayTimestamp, $lt: todayTimestamp + 24 * 60 * 60 } } },
            { $group: { _id: "$url", count: { $sum: 1 } } }
        ]).toArray();
        res.todayVisits = todayVisits.map(item => ({ url: item._id, count: item.count }));
        res.todayVisitsCount = todayVisits.reduce((acc, curr) => acc + curr.count, 0);

        let lastDownloads = await db.collection('downloads').find({ transactionId: { $ne: null } }).sort({ timestamp: -1 }).limit(4).toArray();
        for (let download of lastDownloads) {
            let transaction = await db.collection('transactions').findOne({ _id: ObjectID(download.transactionId) });
            let user = await db.collection('users').findOne({ _id: ObjectID(download.uid) });
            if (transaction && user) {
                res.lastTransactions.push({
                    transaction: transaction,
                    user: {
                        _id: user._id,
                        name: user.name,
                        userAlias: user.userAlias,
                        userRole: user.userRole,
                        profilePhoto: user.profilePhoto
                    }
                });
            }
        }

        let photographers = await db.collection('users').aggregate([
            { $match: { userRole: 'photographer' } },
            {
                $lookup: {
                    from: 'gallery',
                    localField: '_id',
                    foreignField: 'uid',
                    as: 'galleries'
                }
            },
            {
                $project: {
                    userAlias: 1,
                    name: 1,
                    uploadedGalleryCount: { $size: "$galleries" },
                    uploadedPhotosCount: { $sum: { $map: { input: "$galleries", as: "gallery", in: { $size: "$$gallery.photos" } } } }
                }
            }
        ]).toArray();
        res.photographers = photographers;

        if (from && to) {
            let bannerClicks = await db.collection('bannerClicks').aggregate([
                { $match: { timestamp: { $gte: from, $lte: to } } },
                { $group: { _id: "$url", count: { $sum: 1 } } }
            ]).toArray();
            res.bannerClicks = bannerClicks.map(item => ({ url: item._id, count: item.count }));
        }

        if (!startTimestamp || !endTimestamp) {
            const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            startTimestamp = Math.floor(fiveDaysAgo.getTime() / 1000);

            endTimestamp = Math.floor(Date.now() / 1000);
        }

        let galleryVisits = await db.collection('photoVisits').aggregate([
            { $match: { timestamp: { $gte: startTimestamp, $lte: endTimestamp } } },
            { $group: { _id: { galleryId: "$galleryId", photo: "$photo" }, count: { $sum: 1 } } },
            {
                $group: {
                    _id: "$_id.galleryId",
                    name: { $first: "$_id.name" },
                    visits: { $sum: "$count" },
                    photos: {
                        $push: {
                            name: "$_id.photo.name",
                            visits: "$count"
                        }
                    }
                }
            }
        ]).toArray();

        res.galleryVisits = galleryVisits.map(item => ({
            _id: item._id,
            name: item.name,
            visits: item.visits,
            photos: item.photos
        }));

        res.galleryVisits.sort((a, b) => b.visits - a.visits);

        return res;
    }

    async statisticsFromDateRange(from, to) {
        if (!to) {
            to = Math.floor(Date.now() / 1000);
        }

        let res = {
            photosCount: 0,
            photographersCount: 0,
            todayEarnings: 0,
            yesterdayEarnings: 0,
            prevMonthEarnings: 0,
            currentMonthEarnings: 0,
            totalDownloads: await db.collection('downloads').countDocuments(),
            todayDownloads: 0,
            visitsPerDay: [],
            todayVisits: [],
            lastTransactions: [],
            photographers: [],
            bannerClicks: [],
            galleryVisits: []
        };

        const startTimestamp = from || (to - 5 * 24 * 60 * 60);
        const endTimestamp = to;

        res.photosCount = await db.collection('gallery').countDocuments({ isActive: true, userDisabled: { $ne: true } });

        res.photographersCount = await db.collection('users').countDocuments({ userRole: 'photographer', accountEnabled: true });

        res.todayDownloads = await db.collection('downloads').countDocuments({ timestamp: { $gte: startTimestamp, $lt: endTimestamp } });

        res.todayEarnings = await this.calculateEarnings(startTimestamp, endTimestamp);

        const fromDate = new Date(startTimestamp * 1000);
        const toDate = new Date(endTimestamp * 1000);
        const oneDayDifference = (toDate - fromDate) / (1000 * 60 * 60 * 24) === 1;

        if (oneDayDifference) {
            const logs = await db.collection('logs').find({ timestamp: { $gte: startTimestamp, $lt: endTimestamp } }).toArray();

            const timeIncrement = 3600; // 1 hour in seconds
            const visitsPerTimeIncrement = {};
            for (let log of logs) {
                const timestamp = Math.floor(log.timestamp / timeIncrement) * timeIncrement;
                if (!visitsPerTimeIncrement[timestamp]) {
                    visitsPerTimeIncrement[timestamp] = 1;
                } else {
                    visitsPerTimeIncrement[timestamp]++;
                }
            }

            res.visitsPerDay = Object.entries(visitsPerTimeIncrement).map(([timestamp, count]) => ({ timestamp: parseInt(timestamp), count }));

            res.todayVisits = Object.entries(visitsPerTimeIncrement).map(([timestamp, count]) => ({ timestamp: parseInt(timestamp), count }));
            res.todayVisitsCount = Object.values(visitsPerTimeIncrement).reduce((acc, curr) => acc + curr, 0);
        } else {
            let pipeline = [
                {
                    $match: {
                        timestamp: { $gte: startTimestamp, $lte: endTimestamp }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: { $multiply: ["$timestamp", 1000] } } } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ];

            const visitsPerDay = await db.collection("logs").aggregate(pipeline).toArray();
            res.visitsPerDay = visitsPerDay.map(({ _id, count }) => ({ timestamp: new Date(_id).getTime() / 1000, count }));

            let todayVisits = await db.collection('logs').aggregate([
                { $match: { timestamp: { $gte: startTimestamp, $lt: endTimestamp } } },
                { $group: { _id: "$url", count: { $sum: 1 } } }
            ]).toArray();
            res.todayVisits = todayVisits.map(item => ({ url: item._id, count: item.count }));
            res.todayVisitsCount = todayVisits.reduce((acc, curr) => acc + curr.count, 0);
        }

        let lastDownloads = await db.collection('downloads').find({ transactionId: { $ne: null } }).sort({ timestamp: -1 }).limit(4).toArray();
        for (let download of lastDownloads) {
            let transaction = await db.collection('transactions').findOne({ _id: ObjectID(download.transactionId) });
            let user = await db.collection('users').findOne({ _id: ObjectID(download.uid) });
            if (transaction && user) {
                res.lastTransactions.push({
                    transaction: transaction,
                    user: {
                        _id: user._id,
                        name: user.name,
                        userAlias: user.userAlias,
                        userRole: user.userRole,
                        profilePhoto: user.profilePhoto
                    }
                });
            }
        }

        let photoPipeline = [
            { $match: { userRole: 'photographer' } },
            {
                $lookup: {
                    from: 'gallery',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$uid', '$$userId'] },
                                        { $gte: ['$published', startTimestamp] },
                                        { $lt: ['$published', endTimestamp] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'galleries'
                }
            },
            {
                $project: {
                    userAlias: 1,
                    name: 1,
                    uploadedGalleryCount: { $size: "$galleries" },
                    uploadedPhotosCount: { $sum: { $map: { input: "$galleries", as: "gallery", in: { $size: "$$gallery.photos" } } } }
                }
            }
        ];
        let photographers = await db.collection('users').aggregate(photoPipeline).toArray();
        res.photographers = photographers;

        if (from && to) {
            let bannerClicks = await db.collection('bannerClicks').aggregate([
                { $match: { timestamp: { $gte: from, $lte: to } } },
                { $group: { _id: "$url", count: { $sum: 1 } } }
            ]).toArray();
            res.bannerClicks = bannerClicks.map(item => ({ url: item._id, count: item.count }));
        }

        let galleryVisits = await db.collection('photoVisits').aggregate([
            { $match: { timestamp: { $gte: startTimestamp, $lte: endTimestamp } } },
            { $group: { _id: { galleryId: "$galleryId", photo: "$photo" }, count: { $sum: 1 } } },
            {
                $group: {
                    _id: "$_id.galleryId",
                    name: { $first: "$_id.name" },
                    visits: { $sum: "$count" },
                    photos: {
                        $push: {
                            name: "$_id.photo.name",
                            visits: "$count"
                        }
                    }
                }
            }
        ]).toArray();
        res.galleryVisits = galleryVisits.map(item => ({
            _id: item._id,
            name: item.name,
            visits: item.visits,
            photos: item.photos
        }));

        res.galleryVisits.sort((a, b) => b.visits - a.visits);

        return res;
    }

    async statisticsExportWithDate(from, to) {
        if (!to) {
            to = Math.floor(Date.now() / 1000);
        }

        let res = {
            photosCount: 0,
            photographersCount: 0,
            todayEarnings: 0,
            yesterdayEarnings: 0,
            prevMonthEarnings: 0,
            currentMonthEarnings: 0,
            totalDownloads: await db.collection('downloads').countDocuments(),
            todayDownloads: 0,
            visitsPerDay: [],
            todayVisits: [],
            lastTransactions: [],
            photographers: [],
            bannerClicks: [],
            galleryVisits: []
        };

        const startTimestamp = from || (to - 5 * 24 * 60 * 60);
        const endTimestamp = to;

        res.photosCount = await db.collection('gallery').countDocuments({ isActive: true, userDisabled: { $ne: true } });

        res.photographersCount = await db.collection('users').countDocuments({ userRole: 'photographer', accountEnabled: true });

        res.todayDownloads = await db.collection('downloads').countDocuments({ timestamp: { $gte: startTimestamp, $lt: endTimestamp } });

        res.todayEarnings = await this.calculateEarnings(startTimestamp, endTimestamp);

        const fromDate = new Date(startTimestamp * 1000);
        const toDate = new Date(endTimestamp * 1000);
        const oneDayDifference = (toDate - fromDate) / (1000 * 60 * 60 * 24) === 1;

        if (oneDayDifference) {
            const logs = await db.collection('logs').find({ timestamp: { $gte: startTimestamp, $lt: endTimestamp } }).toArray();

            const timeIncrement = 3600; // 1 hour in seconds
            const visitsPerTimeIncrement = {};
            for (let log of logs) {
                const timestamp = Math.floor(log.timestamp / timeIncrement) * timeIncrement;
                if (!visitsPerTimeIncrement[timestamp]) {
                    visitsPerTimeIncrement[timestamp] = 1;
                } else {
                    visitsPerTimeIncrement[timestamp]++;
                }
            }

            res.visitsPerDay = Object.entries(visitsPerTimeIncrement).map(([timestamp, count]) => ({ timestamp: parseInt(timestamp), count }));

            res.todayVisits = Object.entries(visitsPerTimeIncrement).map(([timestamp, count]) => ({ timestamp: parseInt(timestamp), count }));
            res.todayVisitsCount = Object.values(visitsPerTimeIncrement).reduce((acc, curr) => acc + curr, 0);
        } else {
            let pipeline = [
                {
                    $match: {
                        timestamp: { $gte: startTimestamp, $lte: endTimestamp }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: { $multiply: ["$timestamp", 1000] } } } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ];

            const visitsPerDay = await db.collection("logs").aggregate(pipeline).toArray();
            res.visitsPerDay = visitsPerDay.map(({ _id, count }) => ({ timestamp: new Date(_id).getTime() / 1000, count }));

            let todayVisits = await db.collection('logs').aggregate([
                { $match: { timestamp: { $gte: startTimestamp, $lt: endTimestamp } } },
                { $group: { _id: "$url", count: { $sum: 1 } } }
            ]).toArray();
            res.todayVisits = todayVisits.map(item => ({ url: item._id, count: item.count }));
            res.todayVisitsCount = todayVisits.reduce((acc, curr) => acc + curr.count, 0);
        }

        let lastDownloads = await db.collection('downloads').find({ transactionId: { $ne: null } }).sort({ timestamp: -1 }).limit(4).toArray();
        for (let download of lastDownloads) {
            let transaction = await db.collection('transactions').findOne({ _id: ObjectID(download.transactionId) });
            let user = await db.collection('users').findOne({ _id: ObjectID(download.uid) });
            if (transaction && user) {
                res.lastTransactions.push({
                    transaction: transaction,
                    user: {
                        _id: user._id,
                        name: user.name,
                        userAlias: user.userAlias,
                        userRole: user.userRole,
                        profilePhoto: user.profilePhoto
                    }
                });
            }
        }

        let photoPipeline = [
            { $match: { userRole: 'photographer' } },
            {
                $lookup: {
                    from: 'gallery',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$uid', '$$userId'] },
                                        { $gte: ['$published', startTimestamp] },
                                        { $lt: ['$published', endTimestamp] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'galleries'
                }
            },
            {
                $project: {
                    userAlias: 1,
                    name: 1,
                    uploadedGalleryCount: { $size: "$galleries" },
                    uploadedPhotosCount: { $sum: { $map: { input: "$galleries", as: "gallery", in: { $size: "$$gallery.photos" } } } }
                }
            }
        ];
        let photographers = await db.collection('users').aggregate(photoPipeline).toArray();
        res.photographers = photographers;

        if (from && to) {
            let bannerClicks = await db.collection('bannerClicks').aggregate([
                { $match: { timestamp: { $gte: from, $lte: to } } },
                { $group: { _id: "$url", count: { $sum: 1 } } }
            ]).toArray();
            res.bannerClicks = bannerClicks.map(item => ({ url: item._id, count: item.count }));
        }

        let galleryVisits = await db.collection('photoVisits').aggregate([
            { $match: { timestamp: { $gte: startTimestamp, $lte: endTimestamp } } },
            { $group: { _id: { galleryId: "$galleryId", photo: "$photo" }, count: { $sum: 1 } } },
            {
                $group: {
                    _id: "$_id.galleryId",
                    name: { $first: "$_id.name" },
                    visits: { $sum: "$count" },
                    photos: {
                        $push: {
                            name: "$_id.photo.name",
                            visits: "$count"
                        }
                    }
                }
            }
        ]).toArray();
        res.galleryVisits = galleryVisits.map(item => ({
            _id: item._id,
            name: item.name,
            visits: item.visits,
            photos: item.photos
        }));

        res.galleryVisits.sort((a, b) => b.visits - a.visits);
        console.log('RESPONSE : ', res)

        return res;
    }

    async calculateEarnings(startTime, endTime) {
        let downloads = await db.collection('downloads').find({ timestamp: { $gte: startTime, $lt: endTime }, transactionId: { $ne: null } }).toArray();
        let totalEarnings = 0;
        for (let download of downloads) {
            let transaction = await db.collection('transactions').findOne({ _id: ObjectID(download.transactionId) });
            if (transaction) {
                totalEarnings += parseFloat(transaction.transaction.purchase_units[0].amount.total);
            }
        }
        return totalEarnings;
    }

    async deleteOriginals(from, to) {

        let gallery = await db.collection('gallery').find({
            date: { $gte: from, $lte: to }
        }).toArray();

        for (let i = 0; i < gallery.length; i++) {
            try {
                if (gallery[i] && gallery[i].photos) {
                    for (let j = 0; j < gallery[i].photos.length; j++) {
                        fs.unlink(`./photos-store/originals/${gallery[i].photos[j].image}`);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }

        /*const dirs = getDirectories('./photos-store/originals');
        for (let i = 0; i < dirs.length; i++) {
            let directory = dirs[i];
            console.log(directory);
            fs.readdir(directory, (err, files) => {
                if (err) throw err;

                for (const file of files) {
                    fs.unlink(join(directory, file), err => {
                        if (err) throw err;
                    });
                }
            });
        }*/

        return {};

    }

    async downloadBackup(from, to) {
        const rnd = 'd31ixyFCevGK7zvPFrZvQtPucHqtKguEkPmJWz_SjWZOjMW2cz';
        let photosFilename = `/uploads/originals-backup-${rnd}.zip`;
        const mongoFilename = `/uploads/mongo-backup-${rnd}.gz`;
        //await zipDirectory('./photos-store/originals', '.' + photosFilename);
        await mongoDump(mongoFilename);

        var output = fs.createWriteStream('.' + photosFilename);
        var archive = archiver('zip', {
            gzip: true,
            zlib: { level: 9 } // Sets the compression level.
        });

        archive.on('error', function (err) {
            throw err;
        });

        // pipe archive data to the output file
        archive.pipe(output);

        // append files

        let gallery = await db.collection('gallery').find({
            date: { $gte: from, $lte: to }
        }).toArray();

        for (let i = 0; i < gallery.length; i++) {
            try {
                if (gallery[i] && gallery[i].photos) {
                    for (let j = 0; j < gallery[i].photos.length; j++) {
                        archive.file(`./photos-store/originals/${gallery[i].photos[j].image}`, { name: `./photos-store/originals/${gallery[i].photos[j].image}` });
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }



        //
        archive.finalize();




        return {
            photos: photosFilename,
            mongo: mongoFilename
        }
    }

    async setEmailVerified(uid, val) {

        await db.collection('users').updateOne({ _id: ObjectID(uid) }, {
            $set: {
                emailVerified: val == '0' ? false : true
            }
        });

        return {
            response: {
                error: null,
            },
            status: 200
        }

    }
    async setAccountEnabled(uid, val) {
        await db.collection('users').updateOne({ _id: ObjectID(uid) }, {
            $set: {
                accountEnabled: val == '0' ? false : true
            }
        });

        await db.collection('gallery').updateMany({
            uid: ObjectID(uid)

        }, {
            $set: {
                userDisabled: val == '0' ? true : false
            }
        })

        return {
            response: {
                error: null,
            },
            status: 200
        }
    }


    async importSubscribers(subscribers) {
        let arr = subscribers.split('\n');

        for (let i = 0; i < arr.length; i++) {
            await db.collection('subscribers').insertOne({ email: arr[i].trim() });
        }

        return {};
    }


    async fetchSettings() {
        let cat = await db.collection('settings').find({}).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateSettings(data) {
        await db.collection('settings').deleteMany({});
        await db.collection('settings').insertOne(data);

        return {
            response: {},
            status: 200
        }
    }

    async fetchSlide(id) {
        let cat = await db.collection('slides').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateSlide(id, data) {
        let obj = data;

        if (id == 'new') {
            await db.collection('slides').insertOne({
                title: obj.title,
                content: obj.content,
                image: obj.image,
                position: obj.position ? parseInt(obj.position) : 0,
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('slides').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    title: obj.title,
                    content: obj.content,
                    image: obj.image,
                    position: obj.position ? parseInt(obj.position) : 0,
                }
            })
        }

        return {
            response: {},
            status: 200
        }

    }

    async allSlides() {
        let items = await db.collection('slides').find().sort({ position: 1 }).toArray();
        return items;
    }


    async deleteSlide(id) {
        await db.collection('slides').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }





    async fetchFaqCategory(id) {
        let cat = await db.collection('faqCategories').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateFaqCategory(id, data) {
        let obj = data;
        if (obj.name) {
            obj.alias = {};

            for (var key in obj.name) {
                if (obj.name.hasOwnProperty(key)) {
                    obj.alias[key] = generateAlias(obj.name[key]);
                }
            }
        }

        if (id == 'new') {
            await db.collection('faqCategories').insertOne({
                name: obj.name,
                alias: obj.alias,
                position: obj.position ? parseInt(obj.position) : 0,
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('faqCategories').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    name: obj.name,
                    alias: obj.alias,
                    position: obj.position ? parseInt(obj.position) : 0,
                }
            })
        }

        return {
            response: {},
            status: 200
        }
    }

    async allFaqCategories() {
        let items = await db.collection('faqCategories').find().sort({ position: 1 }).toArray();
        return items;
    }


    async deleteFaqCategory(id) {
        await db.collection('faqCategories').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }
    async allSubscribers() {
        let items = await db.collection('subscribers').find().toArray();
        return items;
    }


    async deleteSubscriber(id) {
        await db.collection('subscribers').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }


    async fetchFaq(id) {
        let cat = await db.collection('faq').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async faq(alias) {
        let query = {}
        query[`alias.ba`] = alias;
        let cat = await db.collection('faqCategories').findOne(query);

        if (cat) {
            cat.items = await db.collection('faq').find({ category: cat._id.toString() }).toArray();
            return cat;
        } else {
            return {
                items: []
            }
        }
    }


    async updateFaq(id, data) {
        let obj = data;
        if (obj.name) {
            obj.alias = {};

            for (var key in obj.name) {
                if (obj.name.hasOwnProperty(key)) {
                    obj.alias[key] = generateAlias(obj.name[key]);
                }
            }
        }

        if (id == 'new') {
            await db.collection('faq').insertOne({
                name: obj.name,
                alias: obj.alias,
                content: obj.content,
                category: obj.category,
                position: obj.position ? parseInt(obj.position) : 0,
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('faq').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    name: obj.name,
                    alias: obj.alias,
                    content: obj.content,
                    category: obj.category,
                    position: obj.position ? parseInt(obj.position) : 0,
                }
            })
        }

        return {
            response: {},
            status: 200
        }
    }

    async allFaq() {
        let items = await db.collection('faq').find().sort({ position: 1 }).toArray();
        return items;
    }


    async deleteFaq(id) {
        await db.collection('faq').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }
    async sendTestNewsletter(id) {
        let newsletter = await db.collection('newsletters').findOne({ _id: ObjectID(id) });
        if (!newsletter) {
            return;
        }


        let galleries = [];

        if (newsletter.galleries && newsletter.galleries.length) {
            galleries = await db.collection('gallery').find({ _id: { $in: newsletter.galleries.map(item => ObjectID(item)) } }).toArray();;
        }

        await db.collection('newsletters').updateOne({ _id: ObjectID(id) }, { $set: { status: 'Poslato' } });

        let emails = ['info@zipaphoto.net', 'zipaphoto@gmail.com', 'stanojevic.milan97@gmail.com'];
        // let emails = {};
        // for (let i = 0; i < subscribers.length; i++) {
        //     emails[subscribers[i].email] = subscribers[i].email;
        // }

        // emails = Object.keys(emails);


        let orderItemTemplate = fs.readFileSync('./emails/orderItem.html', 'utf-8');

        let itemsHTML = '';
        for (let i = 0; i < galleries.length; i++) {
            itemsHTML += String.format(orderItemTemplate, `${API_ENDPOINT}/photos/350x/` + encodeURI(galleries[i].photos[0].image), galleries[i].name.ba, galleries[i].description && galleries[i].description.ba ? galleries[i].description.ba : '', galleries[i].alias.ba, galleries[i]._id);
        }

        console.log(emails);


        // for (let i = 0; i < emails.length; i++) {
        //     sendMail(emails[i], newsletter.title.ba, String.format(fs.readFileSync('./emails/newsletter.html', 'utf-8'), newsletter.title.ba, newsletter.image ? `<img src="${newsletter.image}" style="max-width: 80%;" />` : '', newsletter.content ? newsletter.content : '', itemsHTML))
        // }

    }

    async sendNewsletter(id) {
        let newsletter = await db.collection('newsletters').findOne({ _id: ObjectID(id) });
        if (!newsletter) {
            return;
        }


        let galleries = [];

        if (newsletter.galleries && newsletter.galleries.length) {
            galleries = await db.collection('gallery').find({ _id: { $in: newsletter.galleries.map(item => ObjectID(item)) } }).toArray();;
        }

        await db.collection('newsletters').updateOne({ _id: ObjectID(id) }, { $set: { status: 'Poslato' } });

        let subscribers = await db.collection('subscribers').find().toArray();
        let emails = {};
        for (let i = 0; i < subscribers.length; i++) {
            emails[subscribers[i].email] = subscribers[i].email;
        }

        emails = Object.keys(emails);

        let orderItemTemplate = fs.readFileSync('./emails/orderItem.html', 'utf-8');

        let itemsHTML = '';
        for (let i = 0; i < galleries.length; i++) {
            itemsHTML += String.format(orderItemTemplate, `${API_ENDPOINT}/photos/350x/` + encodeURI(galleries[i].photos[0].image), galleries[i].name.ba, galleries[i].description && galleries[i].description.ba ? galleries[i].description.ba : '', galleries[i].alias.ba, galleries[i]._id);
        }


        for (let i = 0; i < emails.length; i++) {
            sendMail(emails[i], newsletter.title.ba, String.format(fs.readFileSync('./emails/newsletter.html', 'utf-8'), newsletter.title.ba, newsletter.image ? `<img src="${newsletter.image}" style="max-width: 80%;" />` : '', newsletter.content ? newsletter.content : '', itemsHTML))
        }

    }

    async fetchNewsletter(id) {
        let cat = await db.collection('newsletters').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateNewsletter(id, data) {
        let obj = data;

        if (id == 'new') {
            await db.collection('newsletters').insertOne({
                title: obj.title,
                content: obj.content,
                image: obj.image,
                galleries: obj.galleries,
                status: 'Na čekanju',
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('newsletters').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    title: obj.title,
                    content: obj.content,
                    galleries: obj.galleries,
                    image: obj.image,
                }
            })
        }

        return {
            response: {},
            status: 200
        }
    }

    async allNewsletter() {
        let items = await db.collection('newsletters').find().sort({ position: 1 }).toArray();
        return items;
    }


    async deleteNewsletter(id) {
        await db.collection('newsletters').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }




    async fetchAnnouncement(id) {
        let cat = await db.collection('announcements').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateAnnouncement(id, data) {
        let obj = data;

        if (id == 'new') {
            await db.collection('announcements').insertOne({
                content: obj.content,
                text: obj.text,
                from: parseInt(obj.from),
                to: parseInt(obj.to),
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('announcements').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    content: obj.content,
                    text: obj.text,
                    from: parseInt(obj.from),
                    to: parseInt(obj.to),
                }
            })
        }

        return {
            response: {},
            status: 200
        }

    }

    async annoucments() {
        let items = await db.collection('announcements').find({
            from: { $lte: Math.floor(new Date().getTime() / 1000) }, to: { $gte: Math.floor(new Date().getTime() / 1000) },
        }).toArray();
        return items;

    }

    async allAnnouncements() {
        let items = await db.collection('announcements').find().toArray();
        return items;
    }


    async deleteAnnouncement(id) {
        await db.collection('announcements').deleteOne({ _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }
    }





    async fetchPage(id) {
        let cat = await db.collection('pages').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updatePage(id, data) {
        let obj = data;
        if (obj.name) {
            obj.alias = {};

            for (var key in obj.name) {
                if (obj.name.hasOwnProperty(key)) {
                    obj.alias[key] = generateAlias(obj.name[key]);
                }
            }
        }

        if (id == 'new') {
            await db.collection('pages').insertOne({
                name: obj.name,
                alias: obj.alias,
                content: obj.content,
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('pages').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    name: obj.name,
                    alias: obj.alias,
                    content: obj.content,
                }
            })
        }

        return {
            response: {},
            status: 200
        }

    }

    async allPages() {
        let items = await db.collection('pages').find().toArray();
        return items;
    }




    async fetchBanner(id) {
        let cat = await db.collection('banners').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }


    async updateBanner(id, data) {
        let obj = data;
        if (id == 'new') {
            await db.collection('banners').insertOne({
                name: obj.name,
                images: obj.images,
                position: parseInt(obj.position),
                leftSide: obj.leftSide ? true : false,
                rightSide: obj.rightSide ? true : false,
                footer: obj.footer ? true : false,
                sponsor: obj.sponsor ? true : false,
                detail: obj.detail ? true : false,
                ad: obj.ad ? true : false,
                hidden: obj.hidden ? true : false,
                published: Math.floor(new Date().getTime() / 1000)
            });
        } else {
            await db.collection('banners').updateOne({
                _id: ObjectID(id),
            }, {
                $set: {
                    name: obj.name,
                    images: obj.images,
                    leftSide: obj.leftSide ? true : false,
                    rightSide: obj.rightSide ? true : false,
                    footer: obj.footer ? true : false,
                    sponsor: obj.sponsor ? true : false,
                    detail: obj.detail ? true : false,
                    ad: obj.ad ? true : false,
                    hidden: obj.hidden ? true : false,
                    position: parseInt(obj.position),
                }
            })
        }

        return {
            response: {},
            status: 200
        }

    }

    async allBanners() {
        let items = await db.collection('banners').find().sort({ position: 1 }).toArray();
        return items;
    }

    async generateImages(dir, filename, fname, extension) {

        webp.cwebp(dir + filename, dir + fname + '.webp', "-q 100", function (status, error) {
            console.log(status, error);
        });

        try {
            const resizeInfo = await easyimage.resize({
                src: dir + filename,
                dst: dir + fname + `-50x` + extension,
                width: 50,
                quality: 100
            });

            webp.cwebp(dir + fname + `-50x` + extension, dir + fname + `-50x` + '.webp', "-q 100", function (status, error) {
                console.log(status, error);
            });


        } catch (e) {

        }

        for (let i = 100; i <= 1200; i += 100) {
            console.log('generating', dir + fname + `-${i}x` + extension)
            try {
                const resizeInfo = await easyimage.resize({
                    src: dir + filename,
                    dst: dir + fname + `-${i}x` + extension,
                    width: i,
                    quality: 100
                });

                webp.cwebp(dir + fname + `-${i}x` + extension, dir + fname + `-${i}x` + '.webp', "-q 100", function (status, error) {
                    console.log(status, error);
                });


            } catch (e) {

            }
        }
    }


    async autoGenerate() {
        fs.readdirSync('./uploads').forEach(async file => {
            let extension = '.' + file.split('.')[1];
            if (extension == '.png' || extension == '.jpg' || extension == '.jpeg') {
                console.log(file);
                await this.generateImages('./uploads/', file, file.split('.')[0], extension);
            }
        });

    }


    upload(file, res) {


        let fname = uuidv4();
        let extension = '.' + file.name.split('.').pop();

        if (extension.indexOf('svg') != -1) {
            extension = '.svg';
        }

        //let base64Image = base64.split(';base64,').pop();
        let filename = fname + extension;

        file.mv('./uploads/' + filename, (err) => {
            if (err) {
                res.status(500).send('Error');
            }

            /*if (extension == '.png' || extension == '.jpg' || extension == '.jpeg') {
                this.generateImages('./uploads/', filename, fname, extension);
            }*/

            res.status(200).send(`${API_ENDPOINT}/uploads/` + filename);


        })
    }


    async login(username, password) {
        //console.log(db);   

        let admin = await db.collection('admins').find({ username: username }).toArray();

        if (!admin.length) {
            return {
                response: {
                    error: 'User not exists'
                },
                status: 404
            };

        } else {
            if (bcrypt.compareSync(password, admin[0].pk)) {
                let token = jwt.sign({ "id": admin[0]._id }, constants.jwtSecretKey, { algorithm: 'HS256' });
                return {
                    response: {
                        token: token
                    },
                    status: 200
                };

            } else {
                return {
                    response: {
                        error: 'Wrong creditials'
                    },
                    status: 400
                };

            }
        }
    }




    async updateOne(id, collection, obj) {
        if (collection === 'blogCategories' || collection === 'technologies' || collection === 'categories' || collection === 'products' || collection === 'pages') {
            if (obj.name) {
                obj.alias = generateAlias(obj.name);
            }
        }

        if (collection === 'categories') {
            let breadcrumb = `/${obj.alias}`;
            if (obj.parentCategory) {
                let parentCategory = await db.collection('categories').find({ _id: ObjectID(obj.parentCategory) }).toArray();
                if (parentCategory && parentCategory.length) {
                    breadcrumb = `${parentCategory[0].breadcrumb}${breadcrumb}`;
                }
            }

            obj.breadcrumb = breadcrumb;
        }


        if (collection === 'blog') {
            if (obj.title) {
                obj.alias = generateAlias(obj.title);
            }
        }


        if (collection === 'products' && obj.category) {
            let category = await db.collection('categories').find({ _id: ObjectID(obj.category) }).toArray();
            if (category.length) {
                obj.breadcrumb = category[0].breadcrumb;
            }
        }


        if (id == 'new') {
            obj.timestamp = Math.floor(new Date().getTime() / 1000);

            await db.collection(collection).insertOne(obj);
        } else {
            delete obj._id;
            await db.collection(collection).updateOne({ _id: ObjectID(id) }, {
                $set: obj
            })
        }
        return {}
    }

    async delete(id, collection) {
        await db.collection(collection).deleteOne({ _id: ObjectID(id) });
        return {}
    }


    async fetchOne(id, collection) {

        let result = await db.collection(collection).find({ _id: ObjectID(id) }).toArray();
        if (result.length) {
            return result[0]
        } else {
            return { error: 'Not found' }
        }
    }

    async fetch(collection) {
        let result = await db.collection(collection).find().toArray();
        return result
    }
    async projects() {
        let result = await db.collection('projects').find().sort({ sort: 1 }).toArray();
        return result;
    }
    async sortProjects(items) {
        for (let i = 0; i < items.length; i++) {
            await db.collection('projects').updateOne({ _id: ObjectID(items[i]._id) }, {
                $set: {
                    sort: i
                }
            })
        }

        return {};
    }



    async home(obj) {
        await db.collection('home').deleteMany({});

        await db.collection('home').insertOne(obj);
        return {}

    }


    async deleteUser(id) {
        await db.collection('gallery').deleteMany({ uid: ObjectID(id) })
        await db.collection('users').deleteOne({ _id: ObjectID(id) });
        return {}
    }


    async getUser(uid) {
        return await db.collection('users').findOne({ _id: ObjectID(uid) });
    }
    checkPassword(password) {
        var decimal = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{6,16}$/;
        if (password.match(decimal))
            return true;
        else
            return false;
    }


    async editUser(uid, data) {
        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        if (!user.length) {
            return { error: `User not exists` };
        }

        let hash;

        if (data.newPassword) {

            if (data.newPassword != data.newPasswordRetyped) {
                return { error: `Lozinke se ne podudaraju.` };

            }

            if (!this.checkPassword(data.newPassword)) {
                return { error: `Lozinka mora da sadrži izmedju 6-16 karaktera, veliko slovo, broj i specijalni karakter.` };

            }


            var salt = bcrypt.genSaltSync(10);
            hash = bcrypt.hashSync(data.newPassword, salt);
        }


        let object = {
            //name: data.name
        }

        if (data.name) {
            object.name = data.name;
            let userAlias = generateAlias(object.name);
            object.userAlias = userAlias;

            db.collection('gallery').updateMany({ uid: ObjectID(uid) }, {
                $set: {
                    userAlias: userAlias,
                    user: object.name
                }
            })
        }

        if (user[0].email != data.email && data.email) {
            object.emailVerified = false;
            object.emailVerificationCode = uuidv4();
            object.email = data.email;
            sendMail(data.email, 'Verifikujte E-mail Adresu', String.format(fs.readFileSync('./emails/verify.html', 'utf-8'), data.email, `https://zipa.novamedia.agency/account/verify/${uid}/${object.emailVerificationCode}`))
        }

        if (hash) {
            object.pk = hash;
        }

        if (data.phoneNumber) {
            object.phoneNumber = data.phoneNumber;
        }

        if (data.businessPhoneNumber) {
            object.businessPhoneNumber = data.businessPhoneNumber;
        }
        if (data.webSite) {
            object.webSite = data.webSite;
        }
        if (data.skype) {
            object.skype = data.skype;
        }
        if (data.twitter) {
            object.twitter = data.twitter;
        }
        if (data.facebook) {
            object.facebook = data.facebook;
        }
        if (data.instagram) {
            object.instagram = data.instagram;
        }
        if (data.country) {
            object.country = data.country;
        }
        if (data.city) {
            object.city = data.city;
        }
        if (data.address) {
            object.address = data.address;
        }
        if (data.profilePhoto) {
            object.profilePhoto = data.profilePhoto;
        }

        if (data.biography) {
            object.biography = data.biography;
        }

        await db.collection('users').updateOne({ _id: user[0]._id }, { $set: object });
        return {}

    }



    async getHome() {

        let result = await db.collection('home').find({}).toArray();
        if (result.length) {
            return result[0];
        } else {
            return {}
        }
    }
    async aboutUs(obj) {
        await db.collection('aboutus').deleteMany({});

        await db.collection('aboutus').insertOne(obj);
        return {}

    }


    async getAboutUs() {

        let result = await db.collection('aboutus').find({}).toArray();
        if (result.length) {
            return result[0];
        } else {
            return {}
        }
    }




}

module.exports = Admin;