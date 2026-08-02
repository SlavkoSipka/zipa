require('dotenv').config();

const express = require("express");
const http = require("http");
const port = process.env.PORT || 10015;
//const nodemailer = require('nodemailer');
const cors = require('cors')
const bodyParser = require("body-parser");
var compression = require('compression');
const fileUpload = require('express-fileupload');

const adminModule = new (require('./admin/admin'))();
const isAdminAuthenticated = require('./admin/auth');

const siteModule = new (require('./site/site'))();
const productsModule = new (require('./products/products'))();
const usersModule = new (require('./users/users'))();

const permissionMiddleware = require('./users/auth');
const roleAndPermissionMiddleware = require('./users/roleAndAuth');

const userCheck = require('./users/check');


Number.prototype.formatPrice = function (sep = 2) {
    let dec_point = '.';
    let thousands_sep = ',';

    var parts = parseFloat(this).toFixed(sep).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands_sep);

    return parts.join(dec_point);
}

String.prototype.formatPrice = function (sep = 2) {
    let dec_point = '.';
    let thousands_sep = ',';

    var parts = parseFloat(this).toFixed(sep).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands_sep);

    return parts.join(dec_point);
}


String.format = function () {
    var s = arguments[0];
    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }
    return s;
}


const logger = function (req, res, next) {

    let object = {
        url: req.url,
        headers: {},
        body: req.body
    }
    if (req.headers['user-agent']) {
        object.headers['user-agent'] = req.headers['user-agent'];
    }

    if (req.headers['referer']) {
        object.headers['referer'] = req.headers['referer'];
    }

    if (req.headers['authorization']) {
        object.headers['authorization'] = req.headers['authorization'];
    }

    //console.log(object);
    next(); // Passing the request to the next handler in the stack.
}


const app = express();
app.use(cors());
app.use(compression());
app.use(bodyParser.json({ limit: '20mb' }));
app.use('/uploads', express.static('uploads'))

// Pregledi fotografija (sa watermarkom) se streamuju iz Cloudflare R2.
// Bucket je privatan — originali se NIKAD ne serviraju ovuda, samo kroz
// /gallery/download rute nakon provere prava.
const storage = require('./storage');

function servePreview(size) {
    return async (req, res) => {
        // req.path je npr. "/borislav-zdrinja/slika.jpg" (URL-enkodovan)
        const image = decodeURIComponent(req.path.replace(/^\//, ''));
        if (!image || image.includes('..')) {
            res.status(400).send('Bad request');
            return;
        }
        try {
            const obj = await storage.getStream(storage.previewKey(size, image));
            res.set({
                'Content-Type': obj.contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                ...(obj.contentLength ? { 'Content-Length': obj.contentLength } : {}),
                ...(obj.etag ? { ETag: obj.etag } : {}),
            });
            obj.body.pipe(res);
        } catch (e) {
            res.status(404).send('Not found');
        }
    };
}

app.use('/photos/350x', servePreview('350x'));
app.use('/photos/700x', servePreview('700x'));

app.use(fileUpload());
//app.use(logger);


const server = http.createServer(app);

server.listen(port, () => console.log(`Listening on port ${port}`));


app.post('/upload', permissionMiddleware(), function (req, res) {
    console.log(req.files);

    if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send('No files were uploaded.');
        return;
    }

    adminModule.upload(req.files.file, res)
});

app.get('/products/featured', async (req, res) => {
    res.send(await productsModule.featuredProducts());
});

app.get('/products/latest', async (req, res) => {
    res.send(await productsModule.latestProducts());
});




app.get('/photographer/statistics', roleAndPermissionMiddleware('photographer', 'change-gallery'), async (req, res) => {
    let result = await usersModule.photographerStatistics(res.locals.uid);
    res.status(200).send(result);
})




app.post('/user/register', async (req, res) => {
    let response = await usersModule.register(req.body.email, req.body.password, req.body.name, req.body.type);
    res.status(response.status).send(response.response);
});

app.post('/user/login', async (req, res) => {
    // adresa se beleži uz prijavu; iza posrednika (Render, Cloudflare)
    // stvarna adresa posetioca stiže u zaglavlju x-forwarded-for
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
        || req.socket.remoteAddress || null;

    let response = await usersModule.login(req.body.email, req.body.password, req.body.rememberMe, {
        ip: ip,
        userAgent: req.headers['user-agent'] || null
    });
    res.status(response.status).send(response.response);
});


app.get('/user/email/verify/:uid/:emailVerificationCode', async (req, res) => {
    let response = await usersModule.verifyEmail(req.params.uid, req.params.emailVerificationCode);
    res.status(response.status).send(response.response);
});

app.post('/user/reset-password', async (req, res) => {
    let response = await usersModule.sendResetPasswordMail(req.body.email);
    res.status(response.status).send(response.response);
});
app.post('/user/reset-password/:uid/:resetPasswordVerificationCode', async (req, res) => {
    let response = await usersModule.resetPassword(req.params.uid, req.params.resetPasswordVerificationCode, req.body.newPassword, req.body.retypedPassword);
    res.status(response.status).send(response.response);
});

app.get('/user/verify', permissionMiddleware(), async (req, res) => {
    res.send(await usersModule.verify(res.locals.uid));
});

app.post('/user/edit', permissionMiddleware(), async (req, res) => {
    let response = await usersModule.editAccount(res.locals.uid, req.body)
    res.status(response.status).send(response.response);
});

app.get('/user/downloads/download-image/:downloadId', permissionMiddleware(), async (req, res) => {
    let result = await usersModule.downloadImage(res.locals.uid, req.params.downloadId)
    res.status(result.status).send(result.response);

});

app.get('/user/downloads/:page/:sort', permissionMiddleware(), async (req, res) => {
    res.send(await usersModule.downloads(res.locals.uid, req.params.page, req.params.sort));
});

app.post('/user/gallery', roleAndPermissionMiddleware('photographer', 'change-gallery'), async (req, res) => {
    res.send(await usersModule.userGallery(res.locals.uid, req.body.page));
});


app.get('/user/reviews', permissionMiddleware(), async (req, res) => {
    res.send(await usersModule.userReviews(res.locals.uid));
});

app.get('/user/reviews/delete/:alias', permissionMiddleware(), async (req, res) => {
    res.send(await usersModule.deleteReview(res.locals.uid, req.params.alias));
});





app.get('/page/:alias', async (req, res) => {
    res.send(await siteModule.page('ba', req.params.alias));
});



app.get('/categories/all', permissionMiddleware('store-products'), async (req, res) => {
    res.send(await productsModule.allCategories());
});
app.get('/categories/tree', async (req, res) => {
    res.send(await productsModule.categoriesTree());
});

app.post('/categories/update/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await productsModule.updateCategory(req.params.id, req.body);
    res.status(result.status).send(result.response);
});

app.get('/categories/get/:id', permissionMiddleware('store-products'), async (req, res) => {
    res.send(await productsModule.fetchCategory(req.params.id));
});

app.post('/products/update/:id', permissionMiddleware('store-products'), async (req, res) => {
    let result = await productsModule.updateProduct(res.locals.uid, req.params.id, req.body);
    res.status(result.status).send(result.response);
});

app.get('/products/promoted', async (req, res) => {
    res.send(await productsModule.promotedProducts());
});

app.post('/products/get/store/:storeAlias/:type', async (req, res) => {
    res.send(await productsModule.fetchStoreProducts(req.params.storeAlias, req.params.type, req.body.page, req.body.search));
});


app.get('/products/get/:storeAlias/:alias/:sku', async (req, res) => {
    res.send(await productsModule.productDetail(req.params.storeAlias, req.params.alias, req.params.sku));
});



app.get('/products/get/:storeAlias/:id', permissionMiddleware('store-products'), async (req, res) => {
    res.send(await productsModule.fetchProduct(res.locals.uid, req.params.storeAlias, req.params.id));
});

app.post('/products/get/:storeAlias', permissionMiddleware('store-products'), async (req, res) => {
    res.send(await productsModule.fetchProducts(res.locals.uid, req.params.storeAlias, req.body.page, req.body.search));
});




app.get('/settings', async (req, res) => {
    res.send(await adminModule.fetchSettings());
});

app.post('/settings/update', permissionMiddleware('*'), async (req, res) => {
    let result = await adminModule.updateSettings(req.body);
    res.status(result.status).send(result.response);
});


app.get('/pages/all', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.allPages());
});

app.post('/pages/update/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await adminModule.updatePage(req.params.id, req.body);
    res.status(result.status).send(result.response);
});

app.get('/pages/get/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.fetchPage(req.params.id));
});


app.get('/slides/all', async (req, res) => {
    res.send(await adminModule.allSlides());
});

app.post('/slides/update/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await adminModule.updateSlide(req.params.id, req.body);
    res.status(result.status).send(result.response);
});

app.get('/slides/get/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.fetchSlide(req.params.id));
});

app.delete('/slides/delete/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.deleteSlide(req.params.id));
});


app.get('/faqCategories/all', async (req, res) => {
    res.send(await adminModule.allFaqCategories());
});

app.post('/faqCategories/update/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await adminModule.updateFaqCategory(req.params.id, req.body);
    res.status(result.status).send(result.response);
});

app.get('/faqCategories/get/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.fetchFaqCategory(req.params.id));
});

app.delete('/faqCategories/delete/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.deleteFaqCategory(req.params.id));
});



app.get('/faq/all', async (req, res) => {
    res.send(await adminModule.allFaq());
});

app.post('/faq/update/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await adminModule.updateFaq(req.params.id, req.body);
    res.status(result.status).send(result.response);
});

app.get('/faq/get/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.fetchFaq(req.params.id));
});

app.delete('/faq/delete/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.deleteFaq(req.params.id));
});

app.get('/faq/:alias', async (req, res) => {
    res.send(await adminModule.faq(req.params.alias));
});

app.get('/announcements', async (req, res) => {
    res.send(await adminModule.annoucments());
});


app.get('/announcements/all', async (req, res) => {
    res.send(await adminModule.allAnnouncements());
});

app.post('/announcements/update/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await adminModule.updateAnnouncement(req.params.id, req.body);
    res.status(result.status).send(result.response);
});

app.get('/announcements/get/:id', async (req, res) => {
    res.send(await adminModule.fetchAnnouncement(req.params.id));
});

app.delete('/announcements/delete/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.deleteAnnouncement(req.params.id));
});



app.get('/banners/all', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.allBanners());
});

app.get('/banners', async (req, res) => {
    res.send(await adminModule.allBanners());
});

app.post('/banner/click', async (req, res) => {
    let result = await adminModule.bannerClick(req.body.url, req.body.bannerId);
    res.status(200).send({});
});


app.post('/banners/update/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await adminModule.updateBanner(req.params.id, req.body);
    res.status(result.status).send(result.response);
});

app.get('/banners/get/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.fetchBanner(req.params.id));
});

app.post('/newsletter/import', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.importSubscribers(req.body.subscribers));
});


app.post('/newsletter/subscribe', async (req, res) => {
    res.send(await usersModule.subscribeToNewsletter(req.body.email));
});


app.get('/newsletter/all', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.allNewsletter());
});
app.get('/subscribers/all', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.allSubscribers());
});

app.post('/newsletter/update/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await adminModule.updateNewsletter(req.params.id, req.body);
    res.status(result.status).send(result.response);
});

app.get('/newsletter/send/test/:id', async (req, res) => {
    res.send(await adminModule.sendTestNewsletter(req.params.id));
});


app.get('/newsletter/send/:id', async (req, res) => {
    res.send(await adminModule.sendNewsletter(req.params.id));
});


app.get('/newsletter/get/:id', async (req, res) => {
    res.send(await adminModule.fetchNewsletter(req.params.id));
});

app.delete('/newsletter/delete/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.deleteNewsletter(req.params.id));
});

app.delete('/subscribers/delete/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.deleteSubscriber(req.params.id));
});




app.get('/gallery/track/:id/:alias/:photo', userCheck, async (req, res) => {
    let result = await productsModule.trackVisit(res.locals.uid, req.params.id, req.params.alias, req.params.photo);
    res.status(result.status).send(result.response);
});


app.post('/gallery/photographer/update/:uid/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await productsModule.updateGallery(req.params.uid, req.params.id, req.body);
    res.status(result.status).send(result.response);
})
app.get('/gallery/photographer/fetch/:uid/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await productsModule.fetchGallery(req.params.uid, req.params.id, req.body);
    res.status(result.status).send(result.response);
})
app.delete('/gallery/photographer/delete/:uid/:id', permissionMiddleware('*'), async (req, res) => {
    let result = await productsModule.deleteGallery(req.params.uid, req.params.id);
    res.status(result.status).send(result.response);
})

app.delete('/gallery/delete/:id', roleAndPermissionMiddleware('photographer', 'change-gallery'), async (req, res) => {
    let result = await productsModule.deleteGallery(res.locals.uid, req.params.id);
    res.status(result.status).send(result.response);
})


app.post('/gallery/update/:id', roleAndPermissionMiddleware('photographer', 'change-gallery'), async (req, res) => {
    let result = await productsModule.updateGallery(res.locals.uid, req.params.id, req.body);
    res.status(result.status).send(result.response);
})
app.get('/gallery/fetch/:id', roleAndPermissionMiddleware('photographer', 'change-gallery'), async (req, res) => {
    let result = await productsModule.fetchGallery(res.locals.uid, req.params.id);
    res.status(result.status).send(result.response);
})
app.get('/gallery/latest', async (req, res) => {
    res.status(200).send(await productsModule.fethcNewestGalleries());
})

app.get('/gallery/get/:lang/:alias/:id', async (req, res) => {
    let result = await productsModule.getGallery(req.params.lang, req.params.alias, req.params.id);
    res.status(result.status).send(result.response);
})




app.get('/gallery/check-resolutions/:lang/:alias/:id', permissionMiddleware(), async (req, res) => {
    let result = await productsModule.checkGalleryResolutions(res.locals.uid, req.params.lang, req.params.alias, req.params.id);
    res.status(result.status).send(result.response);
})
app.get('/gallery/check-resolutions/get/:id', async (req, res) => {
    let result = await productsModule.getGalleryResolutions(req.params.id);
    res.status(result.status).send(result.response);
})




app.post('/gallery/all/:uid', roleAndPermissionMiddleware('admin', '*'), async (req, res) => {
    res.status(200).send(await productsModule.allGallery(req.params.uid, req.body.page, req.body.search));
})

app.get('/gallery/set-user-status/:galleryId/:uid/:status', roleAndPermissionMiddleware('admin', '*'), async (req, res) => {
    let result = await productsModule.setGalleryStatus(req.params.uid, req.params.galleryId, req.params.status);
    res.status(result.status).send(result.response);
})

app.get('/gallery/user-resolutions/:uid', roleAndPermissionMiddleware('admin', '*'), async (req, res) => {
    let result = await productsModule.fetchUserResolutions(req.params.uid);
    res.status(result.status).send(result.response);
})

app.post('/gallery/user-resolutions/:uid', roleAndPermissionMiddleware('admin', '*'), async (req, res) => {
    let result = await productsModule.updateUserResolutions(req.params.uid, req.body);
    res.status(result.status).send(result.response);
})


app.post('/gallery/photos/upload', permissionMiddleware('change-gallery'), function (req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send('No files were uploaded.');
        return;
    }

    productsModule.upload(req.files.file, res.locals.uid, res)
});
app.post('/gallery/photographer/photos/upload/:uid', permissionMiddleware('*'), function (req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send('No files were uploaded.');
        return;
    }

    productsModule.upload(req.files.file, req.params.uid, res)
});


app.get('/photographers', async (req, res) => {
    res.send(await usersModule.photographers());
});
app.get('/photographer/:alias', async (req, res) => {
    res.send(await usersModule.photographer(req.params.alias));
});


app.get('/categories', async (req, res) => {
    res.send(await productsModule.allCategories());
});

app.get('/all-cateogires', async (req, res) => {
    res.send(await productsModule.allCategories1());
});


app.get('/categories/home', async (req, res) => {
    res.status(200).send(await productsModule.fetchHomeCategories());
})

app.post('/gallery/search/:lang', userCheck, async (req, res) => {
    res.send(await productsModule.gallery(res.locals.uid, req.params.lang, req.body.query));
});

app.post('/users/all', permissionMiddleware('*'), async (req, res) => {
    let result = await usersModule.fetchUsers(req.body.page, req.body.search);
    res.send(result);
})

app.delete('/users/delete/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.deleteUser(req.params.id));
});

app.get('/users/get/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.getUser(req.params.id));
});
app.post('/users/edit/:id', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.editUser(req.params.id, req.body));
});


app.get('/users/change/emailVerified/:uid/:val', roleAndPermissionMiddleware('admin', '*'), async (req, res) => {
    let result = await adminModule.setEmailVerified(req.params.uid, req.params.val);
    res.status(result.status).send(result.response);
})
app.get('/users/change/accountEnabled/:uid/:val', roleAndPermissionMiddleware('admin', '*'), async (req, res) => {
    let result = await adminModule.setAccountEnabled(req.params.uid, req.params.val);
    res.status(result.status).send(result.response);
})

app.get('/gallery/download/:galleryId/:photoId/:resolution', permissionMiddleware(), async (req, res) => {
    let result = await usersModule.downloadGalleryImage(res.locals.uid, req.params.galleryId, parseInt(req.params.photoId), parseInt(req.params.resolution));
    res.status(result.status).send(result.response);
});

app.get('/gallery/download/free/:galleryId/:photoId/:resolution', async (req, res) => {
    let result = await usersModule.downloadGalleryImageFree(res.locals.uid, req.params.galleryId, parseInt(req.params.photoId), parseInt(req.params.resolution));
    res.status(result.status).send(result.response);
});

app.get('/cart/add/:galleryId/:photoId/:resolution', permissionMiddleware(), async (req, res) => {
    res.send(await usersModule.addToCart(res.locals.uid, req.params.galleryId, parseInt(req.params.photoId), parseInt(req.params.resolution)));
});

app.get('/cart/remove/:galleryId/:photoId/:resolution', permissionMiddleware(), async (req, res) => {
    res.send(await usersModule.removeFromCart(res.locals.uid, req.params.galleryId, parseInt(req.params.photoId), parseInt(req.params.resolution)));
});
app.get('/cart/empty', permissionMiddleware(), async (req, res) => {
    res.send(await usersModule.emptyCart(res.locals.uid));
});

app.get('/cities', async (req, res) => {
    res.send(await productsModule.galleryCities());
});




app.post('/cart', userCheck, async (req, res) => {
    res.send(await usersModule.cart(res.locals.uid, req.body.cart));
});
app.post('/cart/shipping', userCheck, async (req, res) => {
    res.send(await usersModule.calculateShipping(res.locals.uid, req.body.cart));
});

app.post('/checkout/finish', permissionMiddleware(), async (req, res) => {
    res.send(await usersModule.finishOrder(res.locals.uid, req.body.orderId, req.body.items));
})


app.post('/log', userCheck, async (req, res) => {
    res.send(await usersModule.logVisit(res.locals.uid, req.body.url));
});
app.post('/login-history', permissionMiddleware('*'), async (req, res) => {
    res.send(await usersModule.fetchLoginHistory(req.body.page, {
        from: req.body.from,
        to: req.body.to,
        perPage: req.body.perPage,
        includeAdmins: req.body.includeAdmins
    }));
});

app.post('/logs', permissionMiddleware('*'), async (req, res) => {
    res.send(await usersModule.fetchLogs(req.body.page, req.body.search, {
        from: req.body.from,
        to: req.body.to,
        perPage: req.body.perPage,
        onlyUsers: req.body.onlyUsers
    }));
});
app.post('/downloads', permissionMiddleware('*'), async (req, res) => {
    res.send(await usersModule.fetchDownloads(req.body.page, req.body.search));
});
app.post('/create-backup', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.downloadBackup(parseInt(req.body.from), parseInt(req.body.to)));
});
app.post('/delete-originals', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.deleteOriginals(parseInt(req.body.from), parseInt(req.body.to)));
});

app.get('/admin/statistics', permissionMiddleware('*'), async (req, res) => {
    res.send(await adminModule.statistics());
});
app.post('/admin/statistics', permissionMiddleware('*'), async (req, res) => {
    const { from, to } = req.body;

    const statisticsResult = await adminModule.statisticsFromDateRange(from, to);

    res.json(statisticsResult);
    // res.send(await adminModule.statistics(req.body.from, req.body.to));
});

app.post('/admin/exportVisitsPerDay', async (req, res) => {
    const { from, to } = req.body;

    const statisticsResult = await adminModule.statisticsExportWithDate(from, to);

    res.json(statisticsResult);
    // res.send(await adminModule.statistics(req.body.from, req.body.to));
});

app.post('/contact', async (req, res) => {
    await usersModule.contact(req.body);
    res.status(200).send({});
});



/*
app.get('/test', async () => {
    await usersModule.insertCategories();
})*/

setTimeout(() => {
    productsModule.setPhotosCountToCategories();
}, 3000);
