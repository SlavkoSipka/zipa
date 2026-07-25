const MongoClient = require('mongodb').MongoClient;
const dbAuth = require('./constants').dbAuth;
let connection;

module.exports = function() {
    return new Promise((resolve, reject) => {
       if (connection)
          resolve(connection)
       MongoClient.connect(`mongodb://${dbAuth.username}:${encodeURIComponent(dbAuth.password)}@${dbAuth.server}/${dbAuth.dbName}`, (err, db) => {
          if (err)
             reject(err)
          connection = db.db(dbAuth.dbName);
          resolve(connection) 
       })
    })
}