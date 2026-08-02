const fs = require('fs');
const ObjectID = require('../objectid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const fetch = require('node-fetch');
var piexif = require("piexifjs");
const exiftool = require("exiftool-vendored").exiftool
var watermark = require('dynamic-watermark');
var easyimage = require('easyimage');
const fixUtf8 = require('fix-utf8')

let db;
const dbConnect = require('../db');
const storage = require('../storage');
const sharp = require('sharp');
const { API_ENDPOINT } = require('../constants');
dbConnect()
    .then((conn) => {
        db = conn;
    })
    .catch((e) => {
        //console.log('DB error')
    })


/**
 * Ključne reči iz metapodataka fotografije svodi na uredan niz.
 *
 * FotoStation ih upisuje kao IPTC `Keywords`, a neki programi kao XMP
 * `Subject`; u zavisnosti od programa stižu kao niz ili kao jedan tekst
 * razdvojen zarezima ili tačkom-zarezom.
 */
function normalizeKeywords(value) {
    if (!value) return [];

    const lista = Array.isArray(value) ? value : String(value).split(/[,;]/);

    const ociscene = lista
        .map((rec) => String(rec).trim())
        .filter((rec) => rec.length > 0);

    // izbaci ponovljene, bez obzira na velika/mala slova
    const videne = new Set();
    return ociscene.filter((rec) => {
        const kljuc = rec.toLowerCase();
        if (videne.has(kljuc)) return false;
        videne.add(kljuc);
        return true;
    });
}

/**
 * Naziv aparata iz metapodataka.
 *
 * Model najčešće već sadrži proizvođača ("Canon EOS 20D"), pa bi prosto
 * spajanje dalo "Canon Canon EOS 20D".
 */
function formatCamera(make, model) {
    const proizvodjac = (make || '').trim();
    const model_ = (model || '').trim();

    if (!model_) return proizvodjac || null;
    if (!proizvodjac) return model_;

    return model_.toLowerCase().startsWith(proizvodjac.toLowerCase())
        ? model_
        : `${proizvodjac} ${model_}`;
}

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


class ProductsModule {
    constructor(props) {

    }



    async generateImages(dir, filename, fname, extension) {

        webp.cwebp(dir + filename, dir + fname + '.webp', "-q 100", function (status, error) {
            //console.log(status, error);
        });

        try {
            const resizeInfo = await easyimage.resize({
                src: dir + filename,
                dst: dir + fname + `-50x` + extension,
                width: 50,
                quality: 100
            });

            webp.cwebp(dir + fname + `-50x` + extension, dir + fname + `-50x` + '.webp', "-q 100", function (status, error) {
                //console.log(status, error);
            });


        } catch (e) {

        }

        for (let i = 100; i <= 1200; i += 100) {
            //console.log('generating', dir + fname + `-${i}x` + extension)
            try {
                const resizeInfo = await easyimage.resize({
                    src: dir + filename,
                    dst: dir + fname + `-${i}x` + extension,
                    width: i,
                    quality: 100
                });

                webp.cwebp(dir + fname + `-${i}x` + extension, dir + fname + `-${i}x` + '.webp', "-q 100", function (status, error) {
                    //console.log(status, error);
                });


            } catch (e) {

            }
        }
    }

    /**
     * Upload nove fotografije: original + dva watermarkovana pregleda idu u R2.
     * Ranije je sve islo na lokalni `photos-store/` disk (easyimage + ImageMagick);
     * sada se obrada radi u memoriji preko sharp-a, a fajlovi se cuvaju u R2.
     * Povratni objekat je identican kao ranije da frontend ne mora da se menja.
     */
    async upload(file, uid, res) {
        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();

        if (!user || !user.length) {
            res.status(404).send('User not found');
            return;
        }

        let fname = file.name.split('.')[0];
        let extension = file.name.split('.').pop();
        if (['jpg', 'jpeg'].indexOf(extension.toLowerCase()) === -1) {
            res.status(500).send('Error');
            return;
        }

        // Ako ime vec postoji u R2, dodaj sufiks _0, _1, ... (kao i ranije)
        let retName = file.name;
        if (await storage.exists(storage.originalKey(`${user[0].userAlias}/${retName}`))) {
            let idx = 0;
            while (true) {
                retName = `${fname}_${idx}.${extension}`;
                if (await storage.exists(storage.originalKey(`${user[0].userAlias}/${retName}`))) {
                    idx++;
                    continue;
                }
                break;
            }
        }

        const imagePath = `${user[0].userAlias}/${retName}`;

        try {
            let siteSettings = await db.collection('settings').find({}).toArray();
            const buffer = file.data && file.data.length ? file.data : fs.readFileSync(file.tempFilePath);

            // EXIF/IPTC se cita exiftool-om, koji zahteva fajl na disku
            let exifTags = {};
            const tmpFile = require('path').join(require('os').tmpdir(), `${uuidv4()}.${extension}`);
            try {
                fs.writeFileSync(tmpFile, buffer);
                exifTags = await this.readJPEG(tmpFile);
            } catch (e) {
                console.log('EXIF read error:', e.message);
            } finally {
                try { fs.unlinkSync(tmpFile); } catch (e) { }
            }

            const imageInfo = await sharp(buffer).metadata();

            // Watermark (isti fajl kao i ranije, iz uploads/ foldera)
            let watermarkBuffer = null;
            if (siteSettings.length && siteSettings[0].watermark) {
                const wmPath = `./uploads/${siteSettings[0].watermark.split('/').pop()}`;
                if (fs.existsSync(wmPath)) watermarkBuffer = fs.readFileSync(wmPath);
            }

            // Pregled: smanji na zadatu sirinu pa nalepi watermark preko sredine,
            // sirine 50% slike - identicno starom rasporedu (logoX 88/350, 175/700).
            const makePreview = async (width) => {
                const resized = await sharp(buffer).rotate().resize({ width }).jpeg({ quality: 100 }).toBuffer();
                if (!watermarkBuffer) return resized;
                const meta = await sharp(resized).metadata();
                const wm = await sharp(watermarkBuffer).resize({ width: Math.round(meta.width / 2) }).toBuffer();
                return sharp(resized).composite([{ input: wm, gravity: 'center' }]).jpeg({ quality: 100 }).toBuffer();
            };

            const [x350, x700] = await Promise.all([makePreview(350), makePreview(700)]);

            await Promise.all([
                storage.put(storage.originalKey(imagePath), buffer),
                storage.put(storage.previewKey('350x', imagePath), x350),
                storage.put(storage.previewKey('700x', imagePath), x700),
            ]);

            res.status(200).send({
                image: imagePath,
                name: retName,
                width: imageInfo.width,
                height: imageInfo.height,
                location: exifTags.City,
                copyright: exifTags.Rights,
                captionWriter: exifTags.CaptionWriter,
                author: exifTags.Credit,
                description: exifTags.Description,
                date: exifTags.DateTimeOriginal ? Math.floor(new Date(exifTags.DateTimeOriginal.year, exifTags.DateTimeOriginal.month - 1, exifTags.DateTimeOriginal.day, exifTags.DateTimeOriginal.hour, exifTags.DateTimeOriginal.minute, exifTags.DateTimeOriginal.second, exifTags.DateTimeOriginal.millisecond).getTime() / 1000) : null,
                galleryName: exifTags.ObjectName ? exifTags.ObjectName.replace(/Ä/g, 'č').replace(/Ä‘/g, 'đ').replace(/Ä‡/g, 'ć').replace(/ÄŒ/g, 'Č') : null,

                // Ključne reči koje je fotograf upisao u FotoStation-u (polje Keywords).
                // Preuzimaju se automatski da se ne bi kucale ponovo na sajtu.
                keywords: normalizeKeywords(exifTags.Keywords || exifTags.Subject),

                // Podaci o snimku — za prikaz na stranici fotografije.
                camera: formatCamera(exifTags.Make, exifTags.Model),
                lens: exifTags.LensModel || exifTags.Lens || null,
                iso: exifTags.ISO || null,
                aperture: exifTags.FNumber ? `f/${exifTags.FNumber}` : null,
                shutterSpeed: exifTags.ExposureTime ? String(exifTags.ExposureTime) : null,
                focalLength: exifTags.FocalLength ? String(exifTags.FocalLength) : null
            });
        } catch (e) {
            console.error('Upload error:', e);
            res.status(500).send('Error uploading file');
        }
    }




    async featuredProducts() {
        let products = await db.collection('products').find({ isFeatured: true }, { projection: { _id: 1, name: 1, category: 1, image: 1, price: 1, oldPrice: 1, alias: 1, sales: 1, rating: 1 } }).limit(4).sort({ updated: -1 }).toArray();
        return products;
    }

    async promotedProducts() {
        let products = await db.collection('products').find({ isPromoted: true, isVisible: true }, { projection: { name: 1, images: 1, price: 1, alias: 1, storeName: 1, storeAlias: 1, sku: 1 } }).limit(18).sort({ published: -1 }).toArray();
        return products;
    }

    async latestProducts() {
        let products = await db.collection('products').find({ isVisible: true }, { projection: { name: 1, images: 1, price: 1, alias: 1, storeName: 1, storeAlias: 1, sku: 1 } }).limit(6).sort({ published: -1 }).toArray();
        return products;
    }


    async fetchStoreProducts(storeAlias, type = 'all', page = 0, search = null) {
        let query = { storeAlias: storeAlias, isVisible: true };
        if (type == 'promoted') {
            query.isPromoted = true;
        }
        if (type == 'offer') {
            query.onOffer = true;
        }

        if (search) {
            query.name = new RegExp(search, 'i');
        }

        let products = await db.collection('products').find(query, { projection: { name: 1, images: 1, price: 1, alias: 1, storeName: 1, storeAlias: 1, sku: 1 } }).skip(page * 30).limit(30).sort({ published: -1 }).toArray();
        let total = await db.collection('products').find(query).count();
        return {
            items: products,
            total: Math.ceil(total / 30)
        };
    }


    async deleteGallery(uid, id) {
        await db.collection('gallery').deleteOne({ uid: ObjectID(uid), _id: ObjectID(id) });
        return {
            response: {},
            status: 200
        }

    }

    async updateCategory(id, obj) {

        if (obj.name) {
            obj.alias = {};

            for (var key in obj.name) {
                if (obj.name.hasOwnProperty(key)) {
                    obj.alias[key] = generateAlias(obj.name[key]);
                }
            }
        }


        if (id == 'new') {
            await db.collection('categories').insertOne({
                name: obj.name,
                alias: obj.alias,
                isVisible: obj.isVisible ? true : false,
                isVisibleOnHome: obj.isVisibleOnHome ? true : false,
                isVisibleOnNav: obj.isVisibleOnNav ? true : false,
                isRecommended: obj.isRecommended ? true : false,
                isSpecial: obj.isSpecial ? true : false,
                position: obj.position ? parseInt(obj.position) : 0,

            });
        } else {

            let cat = await db.collection('categories').find({ _id: ObjectID(id) }).toArray();
            db.collection('gallery').updateMany({ 'categoryName.ba': cat[0].name.ba }, {
                $set: {
                    categoryName: obj.name
                }
            });


            await db.collection('categories').updateOne({
                _id: ObjectID(id)
            }, {
                $set: {
                    name: obj.name,
                    alias: obj.alias,
                    isVisible: obj.isVisible ? true : false,
                    isVisibleOnHome: obj.isVisibleOnHome ? true : false,
                    isVisibleOnNav: obj.isVisibleOnNav ? true : false,
                    isRecommended: obj.isRecommended ? true : false,
                    isSpecial: obj.isSpecial ? true : false,
                    position: obj.position ? parseInt(obj.position) : 0,
                }
            })
        }


        return {
            response: {},
            status: 200
        }
    }


    async updateUserResolutions(uid, obj) {
        let check = await db.collection('userResolutions').find({ uid: uid }).toArray();

        if (check.length) {
            await db.collection('userResolutions').updateOne({ _id: check[0]._id }, {
                $set: {
                    'resolution3000px': parseInt(obj['resolution3000px']),
                    'resolution1500px': parseInt(obj['resolution1500px']),
                    'resolution800px': parseInt(obj['resolution800px']),
                    categories: obj.categories,
                    photographers: obj.photographers,
                    from: parseInt(obj.from),
                    to: parseInt(obj.to)
                }
            });
        } else {
            await db.collection('userResolutions').insertOne({
                uid: uid,
                'resolution3000px': parseInt(obj['resolution3000px']),
                'resolution1500px': parseInt(obj['resolution1500px']),
                'resolution800px': parseInt(obj['resolution800px']),
                categories: obj.categories,
                photographers: obj.photographers,
                from: parseInt(obj.from),
                to: parseInt(obj.to)
            })
        }

        return {
            response: {},
            status: 200
        }
    }
    async getGalleryResolutions(id) {
        let resolutions = await db.collection('userResolutions').find({ uid: id }).toArray();
        if (resolutions.length) {
            return {
                status: 200,
                response: resolutions[0]
            }
        } else {
            return {
                status: 200,
                response: {}
            }
        }

    }

    async checkGalleryResolutions(uid, lang = 'ba', alias, id) {
        // let query = {};
        let query = { _id: ObjectID(id) };
        query['alias.' + lang] = alias;
        // query.userAlias = photographer;
        let product = await db.collection('gallery').find(query).toArray();
        //console.log(product)
        if (product.length) {

            if (uid == product[0].uid.toString()) {
                return {
                    response: {
                        'resolution3000px': true,
                        'resolution1500px': true,
                        'resolution800px': true,
                    }, status: 200
                }

            }

            let resolutions = await db.collection('userResolutions').find({ uid: uid, from: { $lte: Math.floor(new Date().getTime() / 1000) }, to: { $gte: Math.floor(new Date().getTime() / 1000) } }).toArray();
            //console.log(resolutions);
            if (!resolutions.length) {
                return {
                    response: {
                        'resolution3000px': false,
                        'resolution1500px': false,
                        'resolution800px': false,
                    },
                    status: 200
                }
            }

            if (resolutions[0].categories && resolutions[0].categories.length) {
                let found = false;
                for (let i = 0; i < resolutions[0].categories.length; i++) {
                    for (let j = 0; j < product[0].category.length; j++) {
                        if (product[0].category[j] == resolutions[0].categories[i]) {
                            found = true;
                            break;
                        }
                    }

                    if (found == true) {
                        break;
                    }
                }

                if (!found) {
                    return {
                        response: {
                            'resolution3000px': false,
                            'resolution1500px': false,
                            'resolution800px': false,
                        },
                        status: 200
                    }

                }

            }

            if (resolutions[0].photographers && resolutions[0].photographers.length) {
                if (resolutions[0].photographers.indexOf(product[0].uid.toString()) == -1) {
                    return {
                        response: {
                            'resolution3000px': false,
                            'resolution1500px': false,
                            'resolution800px': false,
                        },
                        status: 200
                    }
                }
            }

            return {
                response: {
                    'resolution3000px': resolutions[0]['resolution3000px'] > 0 ? true : false,
                    'resolution1500px': resolutions[0]['resolution1500px'] > 0 ? true : false,
                    'resolution800px': resolutions[0]['resolution800px'] > 0 ? true : false,
                }, status: 200
            }
        } else {
            return { response: null, status: 404 }
        }

    }




    async fetchUserResolutions(uid) {
        let check = await db.collection('userResolutions').find({ uid: uid, /*from: {$lte: Math.floor(new Date().getTime() / 1000)}, to: {$gte: Math.floor(new Date().getTime() / 1000)}*/ }).toArray();

        if (check.length) {
            return {
                response: check[0],
                status: 200
            }
        } else {
            return {
                response: {
                    'resolution3000px': 0,
                    'resolution1500px': 0,
                    'resolution800px': 0,
                },
                status: 200
            }
        }
    }


    async setGalleryStatus(uid, galleryId, status) {
        let check = await db.collection('gallerySettings').find({ uid: uid, galleryId: galleryId }).toArray();

        if (check.length) {
            await db.collection('gallerySettings').updateOne({ _id: check[0]._id }, {
                $set: {
                    status: status == '0' ? false : true
                }
            });
        } else {
            await db.collection('gallerySettings').insertOne({
                uid: uid,
                galleryId: galleryId,
                status: status == '0' ? false : true
            })
        }

        return {
            response: {},
            status: 200
        }

    }

    async allGallery(uid, page = 0, search = null) {


        let query = {};

        if (search) {
            query['name.ba'] = new RegExp(search, 'i');
        }

        //console.log(query);


        let items = await db.collection('gallery').find(query).skip(page * 20).limit(20).toArray();

        for (let i = 0; i < items.length; i++) {
            let check = await db.collection('gallerySettings').find({ uid: uid, galleryId: items[i]._id.toString(), status: true }).count();
            if (check)
                items[i].userGalleryStatus = true;
        }

        return {
            items: items,
            total: Math.ceil(await db.collection('gallery').find(query).count() / 20)
        };

    }



    async updateGallery(uid, id, obj) {
        //obj.alias = generateAlias(obj.name);
        if (obj.name) {
            obj.alias = {};

            for (var key in obj.name) {
                if (obj.name.hasOwnProperty(key)) {
                    obj.alias[key] = generateAlias(obj.name[key]);
                }
            }

        }


        let user = await db.collection('users').find({ _id: ObjectID(uid) }).toArray();
        let userAlias = generateAlias(user[0].name);

        if (obj.category && obj.category.length) {

            let categoryQuery = { isVisible: true, _id: { $in: [] } };
            for (let j = 0; j < obj.category.length; j++) {
                categoryQuery._id['$in'].push(ObjectID(obj.category[j]));
            }

            let categories = await db.collection('categories').find(categoryQuery).sort({ position: 1 }).toArray();
            if (categories.length) {
                let categoryName = categories[0].name;
                for (let j = 0; j < categories.length; j++) {
                    if (categories[j].isRecommended) {
                        categoryName = categories[j].name;
                        break;
                    }

                }

                obj.categoryName = categoryName;
            }

        }

        if (obj.photos && obj.photos.length) {
            for (let i = 0; i < obj.photos.length; i++) {

                let changeMeta = false;
                let metaObject = {};

                if (obj.photos[i].name) {
                    metaObject['Title'] = obj.photos[i].name;
                    changeMeta = true;
                }
                if (obj.photos[i].copyright) {
                    metaObject['Rights'] = obj.photos[i].copyright;
                    changeMeta = true;
                }
                if (obj.photos[i].description) {
                    metaObject['Description'] = obj.photos[i].description;
                    changeMeta = true;
                }

                //console.log(metaObject);

                if (changeMeta) {
                    //exiftool.write(obj.photos[i].image.replace('https://zipa-api.novamedia.agency', '.'), metaObject);
                }

                if (obj.photos[i].width > obj.photos[i].height) {
                    obj.orientationPortrait = true;
                } else {
                    obj.orientationHorizontal = true;
                }

            }
        }



        if (id == 'new') {
            obj._id = ObjectID();
            await db.collection('gallery').insertOne({
                _id: obj._id,
                name: obj.name,
                alias: obj.alias,
                price: obj.price ? parseFloat(obj.price) : 0,
                isActive: obj.isActive ? true : false,
                description: obj.description,
                keywords: obj.keywords,
                photos: obj.photos,
                category: obj.category,
                location: obj.location,
                date: obj.date,
                forcedDate: obj.forcedDate,
                requiredDate: obj.requiredDate,
                published: Math.floor(new Date().getTime() / 1000),
                uid: ObjectID(uid),
                userAlias: userAlias,
                user: user[0].name,
                categoryName: obj.categoryName ? obj.categoryName : '',
                orientationPortrait: obj.orientationPortrait,
                orientationHorizontal: obj.orientationHorizontal,

            });
        } else {
            await db.collection('gallery').updateOne({
                _id: ObjectID(id),
                uid: ObjectID(uid)
            }, {
                $set: {
                    name: obj.name,
                    alias: obj.alias,
                    price: obj.price ? parseFloat(obj.price) : 0,
                    isActive: obj.isActive ? true : false,
                    description: obj.description,
                    keywords: obj.keywords,
                    photos: obj.photos,
                    category: obj.category,
                    location: obj.location,
                    date: obj.date,
                    forcedDate: obj.forcedDate,
                    requiredDate: obj.requiredDate,
                    userAlias: userAlias,
                    user: user[0].name,
                    categoryName: obj.categoryName ? obj.categoryName : '',
                    orientationPortrait: obj.orientationPortrait,
                    orientationHorizontal: obj.orientationHorizontal,
                }
            })
        }

        this.setPhotosCountToCategories();

        return {
            response: {
                link: `/galerija/${obj.alias.ba}/${obj._id}`
            },
            status: 200
        }
    }


    readJPEG(path) {
        return new Promise((resolve, reject) => {
            exiftool
                .read(path)
                .then((tags /*: Tags */) =>
                    resolve(tags)
                )
                .catch((err) => reject(err))


        })
    }

    writeJPEG(path, object) {
        return new Promise((resolve, reject) => {
            exiftool
                .write(path)
                .then((tags /*: Tags */) =>
                    resolve(tags)
                )
                .catch((err) => reject(err))


        })
    }


    async fetchGallery(uid, id) {
        let product = await db.collection('gallery').find({ _id: ObjectID(id), uid: ObjectID(uid) }).toArray();
        if (product.length) {
            for (let i = 0; i < product[0].photos.length; i++) {
                try {
                    let tags = await this.readJPEG(product[0].photos[i].image.replace(`${API_ENDPOINT}`, '.'));
                    //console.log(tags);
                    product[0].photos[i].name = tags.Title;
                    product[0].photos[i].copyright = tags.Rights;
                    product[0].photos[i].description = tags.Description;
                } catch (error) {
                    console.log(error)
                }
            }
            return { response: product[0], status: 200 }
        } else {
            return { response: null, status: 404 }
        }
    }

    async getGallery(lang = 'ba', alias, id) {

        let query = { _id: ObjectID(id) };

        if (lang === 'en') {
            query['$or'] = [
                { 'alias.en': alias },
                { 'alias.ba': alias }
            ]
        } else {
            query['alias.ba'] = alias;
        }

        try {

            let product = await db.collection('gallery').find(query).toArray();

            if (product.length) {
                // Da li original postoji u R2 (stari sajt je brisao originale
                // starijih galerija, pa se za njih ne nudi kupovina pune rezolucije)
                let photos = product[0].photos || [];
                let flags = await Promise.all(photos.map((p) => storage.originalExists(p.image)));
                for (let i = 0; i < photos.length; i++) {
                    photos[i].originalIsOnServer = flags[i];
                }
                return { response: product[0], status: 200 }
            } else {
                return { response: { error: 'not found' }, status: 404 }
            }

        } catch (error) {
            console.error('Error occurred:', error);
            return { response: { error: 'internal server error' }, status: 500 };
        }
    }


    async fethcNewestGalleries() {
        let items = await db.collection('gallery').find({ isActive: true, userDisabled: { $ne: true } }).limit(7).sort({ published: -1 }).toArray();
        for (let i = 0; i < items.length; i++) {
            if (!items[i].category || (items[i].category && !items[i].category.length)) {
                continue;
            }

            let categoryQuery = { isVisible: true, _id: { $in: [] } };
            for (let j = 0; j < items[i].category.length; j++) {
                categoryQuery._id['$in'].push(ObjectID(items[i].category[j]));
            }

            let categories = await db.collection('categories').find(categoryQuery).sort({ position: 1 }).toArray();
            if (!categories.length) {
                continue;
            }

            let categoryName = categories[0].name;
            for (let j = 0; j < categories.length; j++) {
                if (categories[j].isRecommended) {
                    categoryName = categories[j].name;
                    break;
                }

            }

            items[i].categoryName = categoryName;
        }

        return items;

    }


    async updateProduct(uid, id, data) {
        let obj = data.product;
        let storeAlias = data.store;

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

            obj.alias = generateAlias(obj.name);

            if (id == 'new') {
                await db.collection('products').insertOne({
                    name: obj.name,
                    alias: obj.alias,
                    sku: obj.sku,
                    barCode: obj.barCode,
                    brand: obj.brand,
                    stock: parseInt(obj.stock),
                    minOrder: obj.minOrder ? parseInt(obj.minOrder) : 1,
                    price: obj.price ? parseFloat(obj.price) : 0,
                    used: obj.used ? true : false,
                    shortDescription: obj.shortDescription,
                    isVisible: obj.isVisible ? true : false,
                    isPromoted: obj.isPromoted ? true : false,
                    isPopular: obj.isPopular ? true : false,
                    onOffer: obj.onOffer ? true : false,
                    images: obj.images,
                    description: obj.description,
                    weight: parseFloat(obj.weight),
                    height: parseFloat(obj.height),
                    length: parseFloat(obj.length),
                    width: parseFloat(obj.width),
                    category: obj.category,
                    storeId: store[0]._id,
                    storeAlias: storeAlias,
                    storeName: store[0].name,
                    storeImage: store[0].profilePhoto,
                    region: store[0].region,
                    city: store[0].city,
                    published: Math.floor(new Date().getTime() / 1000)
                });
            } else {
                await db.collection('products').updateOne({
                    _id: ObjectID(id),
                    storeId: store[0]._id
                }, {
                    $set: {
                        name: obj.name,
                        alias: obj.alias,
                        sku: obj.sku,
                        barCode: obj.barCode,
                        brand: obj.brand,
                        stock: parseInt(obj.stock),
                        minOrder: obj.minOrder ? parseInt(obj.minOrder) : 1,
                        price: obj.price ? parseFloat(obj.price) : 0,
                        used: obj.used ? true : false,
                        shortDescription: obj.shortDescription,
                        isVisible: obj.isVisible ? true : false,
                        isPromoted: obj.isPromoted ? true : false,
                        isPopular: obj.isPopular ? true : false,
                        onOffer: obj.onOffer ? true : false,
                        images: obj.images,
                        description: obj.description,
                        weight: parseFloat(obj.weight),
                        height: parseFloat(obj.height),
                        length: parseFloat(obj.length),
                        width: parseFloat(obj.width),
                        category: obj.category,
                        storeAlias: storeAlias,
                        storeName: store[0].name,
                        region: store[0].region,
                        city: store[0].city,
                        storeImage: store[0].profilePhoto,

                    }
                })
            }

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


    async fetchProduct(uid, storeAlias, id) {
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
            let product = await db.collection('products').find({ _id: ObjectID(id), storeId: store[0]._id }).toArray();
            if (product.length) {
                return product[0]
            } else {
                return {}
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


    async productDetail(storeAlias, alias, sku) {
        let product = await db.collection('products').find({ storeAlias: storeAlias, alias: alias, sku: sku }).toArray();
        if (product.length) {
            return product[0]
        } else {
            return {}
        }
    }


    /*async randomStatistics() {
        let today = new Date();
        today.setHours(0, 0, 0, 0);

        let todayTimestamp = Math.floor(today.getTime() / 1000);
        let product = await db.collection('products').find({ storeAlias: 'centrum-trade', alias: 'laptop-hp-probook-650-g1-i5-4300m-8gb-128gb-ssd', sku: '0001' }).toArray();

        if (product.length) {
            for (let i = 0; i < 500; i++) {
                await db.collection('visits').insertOne({
                    productId: product[0]._id,
                    productImage: product[0].images && product[0].images[0],
                    productName: product[0].name,
                    storeId: product[0].storeId,
                    uid: null,
                    timestamp: Math.floor( todayTimestamp + Math.floor(Math.random() * 24 * 60 * 60)  )
                });
            }
        }

    }*/

    async trackVisit(uid, id, alias, photo) {

        let gallery = await db.collection('gallery').findOne({ _id: ObjectID(id), 'alias.ba': alias });

        if (gallery) {
            await db.collection('photoVisits').insertOne({
                galleryUid: gallery.uid,
                galleryId: gallery._id,
                photo: gallery.photos[parseInt(photo)],
                uid: uid ? uid : null,
                timestamp: Math.floor(new Date().getTime() / 1000)
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
                    error: 'Proizvod nije pronadjen.',

                },
                status: 404
            }

        }
    }



    async fetchProducts(uid, storeAlias, page = 0, search = null) {
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
        //console.log(user[0].storeId, store[0]._id, typeof user[0].storeId, typeof store[0]._id)
        if (user[0].permissions.indexOf('*') !== -1 || (user[0].storeId && store[0]._id && user[0].storeId.toString() == store[0]._id.toString())) {

            let query = { storeId: store[0]._id };

            if (search) {
                query.name = new RegExp(search, 'i');
            }


            let products = await db.collection('products').find(query).skip(page * 20).limit(20).toArray();
            return {
                items: products,
                total: Math.ceil(await db.collection('products').find(query).count() / 20)
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


    async allCategories1() {
        let items = await db.collection('categories').find({}).sort({ position: 1 }).toArray();
        return items;
    }

    async allCategories() {
        let items = await db.collection('categories').find({ isVisible: true }).sort({ position: 1 }).toArray();
        return items;
    }

    async fetchHomeCategories() {
        let categories = await db.collection('categories').find({ isVisible: true, isVisibleOnHome: true }).sort({ position: 1 }).toArray();
        for (let i = 0; i < categories.length; i++) {
            categories[i].photos = await db.collection('gallery').find({ isActive: true, category: { $in: [categories[i]._id.toString()] } }).limit(3).sort({ published: -1 }).toArray();
        }

        return categories;
    }



    async fetchCategory(id) {
        let cat = await db.collection('categories').find({ _id: ObjectID(id) }).toArray();
        if (cat.length) {
            return cat[0]
        } else {
            return {}
        }
    }

    async mainCategories() {

        let items = await db.collection('categories').find({ parentCategory: null }).toArray();
        return items;
    }

    async galleryCities() {
        let gallery = await db.collection('gallery').find({ location: { $ne: '' }, isActive: true }, { projection: { location: 1 } }).toArray();
        let items = {};
        for (let i = 0; i < gallery.length; i++) {
            if (gallery[i].location) {
                items[gallery[i].location] = gallery[i].location;
            }
        }

        return Object.keys(items);
    }


    async setPhotosCountToCategories() {
        // Jednim upitom, jer bi učitavanje `photos` nizova za svih 9.965 galerija
        // (200k+ fotografija) samo radi brojanja pojelo memoriju servera.
        await db.query(`
            update categories c
               set "photosCount" = coalesce((
                     select sum(jsonb_array_length(g.photos))
                       from gallery g
                      where g.category @> array[c."_id"]
                        and g.photos is not null
                   ), 0)
        `);
    }

    createRegexPattern(input) {
        const replacements = {
          c: '[cćč]',
          s: '[sš]',
          z: '[zž]',
          d: '[dđ]',
          C: '[CĆČ]',
          S: '[SŠ]',
          Z: '[ZŽ]',
          D: '[DĐ]'
        };
      
        return input.replace(/[cszCdSD]/g, (match) => replacements[match] || match);
      }

    async gallery(uid, lang = 'ba', query) {
        const galleryQuery = {
            isActive: true,
            userDisabled: { $ne: true },
            [`alias.${lang}`]: { $ne: '' }
        };
    
        if (query.photographer) {
            galleryQuery.userAlias = query.photographer;
        }
        if (query.category) {
            let categoryIds = [];

            if (query.category.includes('Sve kategorije') || query.category.includes('All categories')) {
                const allCategories = await db.collection('categories').find().toArray();
                categoryIds = allCategories.map(cat => cat._id.toString());
            } else {
                const categories = await db.collection('categories')
                    .find({ [`alias.${lang}`]: { $in: query.category } })
                    .toArray();
                categoryIds = categories.map(cat => cat._id.toString());
            }

            galleryQuery.category = { $in: categoryIds };
        }

        if (query.search) {
            const mutatedSearchWithRegex = this.createRegexPattern(query.search)
            console.log('MUTATED SEARH : ', mutatedSearchWithRegex)
            const searchRegex = new RegExp(mutatedSearchWithRegex, 'i');
            galleryQuery.$or = [
                { 'name.ba': searchRegex },
                { 'alias.ba': searchRegex },
                { 'description.ba': searchRegex },
                { 'location': searchRegex },
                { 'user': searchRegex },
                { 'categoryName.ba': searchRegex },
                { tags: searchRegex }
            ];
        }

        if (query['orientation-portrait']) {
            galleryQuery.orientationHorizontal = true;
        }

        if (query['orientation-horizontal']) {
            galleryQuery.orientationPortrait = true;
        }

        if (query.keywords) {
            galleryQuery[`keywords.${lang}`] = { $in: query.keywords.split(',') };
        }

        if (query.city) {
            galleryQuery.location = new RegExp(query.city, 'i');
        }

        /*
         * Pretraga po datumu fotografisanja.
         *
         * Korisnik bira datum, ne vreme, pa opseg mora da obuhvati ceo dan.
         * Ranije je početak pomeran na 00:01, zbog čega je ispadala svaka
         * galerija zabeležena tačno u ponoć — a takvih je oko petine arhive.
         * Zato se za izabran jedan dan opseg proširuje na punih 24 sata.
         */
        const DAN_U_SEKUNDAMA = 24 * 60 * 60;
        let dateFrom = query['date-from'] ? parseInt(query['date-from']) : null;
        let dateTo = query['date-to'] ? parseInt(query['date-to']) : null;

        if (dateFrom !== null && dateTo !== null && dateTo <= dateFrom) {
            dateTo = dateFrom + DAN_U_SEKUNDAMA - 1;
        }

        if (dateFrom !== null && dateTo !== null) {
            galleryQuery.date = { $gte: dateFrom, $lte: dateTo };
        } else if (dateFrom !== null) {
            galleryQuery.date = { $gte: dateFrom };
        } else if (dateTo !== null) {
            galleryQuery.date = { $lte: dateTo };
        }
        if (uid && query.subscription && query.subscription == 'true') {
            const userResolutions = await db.collection('userResolutions').find({
                uid: uid,
                from: { $lte: Math.floor(new Date().getTime() / 1000) },
                to: { $gte: Math.floor(new Date().getTime() / 1000) },
                $or: [
                    { resolution3000px: { $gt: 0 } },
                    { resolution1500px: { $gt: 0 } },
                    { resolution800px: { $gt: 0 } },
                    { resolution350px: { $gt: 0 } }
                ]
            }).toArray();

            if (userResolutions.length) {
                if (userResolutions[0].categories && userResolutions[0].categories.length) {
                    if (galleryQuery.category) {
                        galleryQuery.category.$in.push(...userResolutions[0].categories);
                    } else {
                        galleryQuery.category = { $in: userResolutions[0].categories };
                    }
                }

                if (userResolutions[0].photographers && userResolutions[0].photographers.length) {
                    const photographerIds = userResolutions[0].photographers.map(id => ObjectID(id));
                    galleryQuery.uid = { $in: photographerIds };
                }
            }
        }

        const ipp = query.ipp ? Math.min(parseInt(query.ipp), 200) : 24;
        const page = query.page ? parseInt(query.page) : 0;

        const totalCount = await db.collection('gallery').countDocuments(galleryQuery);
        const items = await db.collection('gallery')
            .find(galleryQuery)
            .skip(ipp * page)
            .limit(ipp)
            .sort({ date: -1 })
            .toArray();

        return {
            total: Math.ceil(totalCount / ipp),
            items: items
        };
    }

}

module.exports = ProductsModule;