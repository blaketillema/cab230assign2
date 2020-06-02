var express = require('express');
var jwt = require('jsonwebtoken')
var router = express.Router();
const secretKey = "secret key"

const authorize = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;

  if(authorization && authorization.split(" ").length == 2){
    token = authorization.split(" ")[1]
    console.log("Token: ", token)
  } else {
    console.log("Unauthorized user")
    res.status(401).json({error: true, message: "Unauthorized"})
    return
  }

  try{
    const decoded = jwt.verify(token, secretKey)

    if(decoded.exp > Date.now()) {
      console.log("Token expired")
      return
    }
    next()
  } catch (e) {
    console.log("Token not valid: ", e)
  }
}

router.get('/symbols', function(req, res, next){
  console.log(req.query.industry)
  var query;
  if(req.query.industry){
    query = req.db.from('stocks').select('name', 'symbol', 'industry').where('industry','like','%'+req.query.industry+'%').distinct()
  }else{
    query = req.db.from('stocks').select('name', 'symbol', 'industry').distinct()
  }
  query
    .then(rows => {
    res.json(rows)
  })
  .catch(err => {
    console.log(err);
    res.json({"Error": true, "Message": err})
  })
})

router.get('/:Symbol', function(req, res, next){
  req.db.from('stocks').select('*').where('symbol','=',req.params.Symbol)
  .then(row => {
    res.json(row[0])
  })
  .catch(err => {
    console.log(err)
    res.json({"Error": true, "Message": err})
  })
})

router.get('/authed/:Symbol', authorize, function(req, res, next){
  req.db.from('stocks').select('*')
  .where('symbol','=',req.params.Symbol)
  .andWhere('timestamp', '>', req.query.from)
  .andWhere('timestamp', '<', req.query.to)
  .then(rows => {
    res.json(rows)
  })
  .catch(err => {
    console.log(err)
    res.json({"Error": true, "Message": err})
  })
})

module.exports = router;
