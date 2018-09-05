const express = require('express')
const DarkSky = require('dark-sky')
const mongo = require('mongodb');
const darksky = new DarkSky('YOUR DARKSKY API KEY')
const MongoClient = require('mongodb').MongoClient;
const MongoUrl = "mongodb://localhost:27017/";
const saveEverySec = 3600 * 3; // 3 hour
const app = express();
const port = process.env.PORT || 5656;
const lat = '38.930034'
const lng = '45.628941'
const dbName = 'darksky'
const collectionName = 'weather'

app.get('/api/weather', (req, res) => {
  let dbRes, apiRes;
  ReadLastFromDb((r) => {
    dbRes = r;
    GetFromApi((r) => {
      apiRes = r;
      if(!dbRes || apiRes.currently.time-dbRes.currently.time>saveEverySec)
        AddToDb(apiRes);
    })
    res.json(r)
  });
})

app.listen(port, () => {
  console.log(`Running at http://localhost:${port}/api/weather`)
})

function GetFromApi(cb) {
  darksky
    .latitude(lat)
    .longitude(lng)
    .units('si')
    .get()
    .then(
      (res) => {
        cb(res);
      }
    )
    .catch(console.log)
}

function AddToDb(data) {
  MongoClient.connect(MongoUrl, function (err, db) {
    if (err) throw err;
    let dbo = db.db(dbName);

    dbo.collection(collectionName).insertOne(data, function (err, res) {
      if (err) throw err;
      console.log("Added to db in: " + Date());
      db.close();
    });
  });
}

function ReadLastFromDb(cb) {
  MongoClient.connect(MongoUrl, function (err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);
    dbo.collection(collectionName).findOne({}, { sort: { $natural: -1 } }, function (err, result) {
      if (err) throw err;
      db.close();
      cb(result);
    });
  });
}