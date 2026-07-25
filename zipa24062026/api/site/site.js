const fs = require('fs');
const ObjectID = require('../objectid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const fetch = require('node-fetch');

let db;
const dbConnect = require('../db');
dbConnect()
    .then((conn) => {
        db = conn;
    })
    .catch((e) => {
        console.log('DB error')
    })

class Site {
    constructor(props) {

    }


    async page(lang='ba', alias) {
        let query = {};
        query[`alias.${lang}`] = alias;
        let res = await db.collection('pages').find(query).toArray();
        if (res.length){
            return res[0]
        }else{
            return {}
        }
    }


    async seo(lang='ba', url){
        let query = {};
        query['url.'+lang] = url;

        let res = await db.collection('seo').find(query).toArray();
        if (res.length){
            return res[0]
        }else{
            return {}
        }
    }


    async getSeoSitemap(){
        let seo = await db.collection('seo').find().toArray();
        return seo;
    }

}

module.exports = Site;