var express = require('express');
var jwt = require('jsonwebtoken')
var router = express.Router();
const secretKey = "secret key"

const authorize = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;

  if(authorization && authorization.split(" ").length == 2){
    token = authorization.split(" ")[1]
  } else {
    res.status(403).json({error: true, message: "Unauthorized"})
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
  var query;
  if(Object.keys(req.query).length == 0 || Object.keys(req.query).length > 1){
    if(Object.keys(req.query).length > 1){
      res.status(400).json({
        error: true,
        message: "Invalid query parameter: only 'industry' is permitted"
      })
      return
    }
    else{
      query = req.db.from('stocks').select('name', 'symbol', 'industry').distinct()
    }
  }
  else{
    if(req.query.industry){
      query = req.db.from('stocks').select('name', 'symbol', 'industry').where('industry','like','%'+req.query.industry+'%').distinct()
    }
    else{
      res.status(400).json({
        error: true,
        message: "Invalid query parameter: only 'industry' is permitted"
      })
      return
    }
  }
  query
    .then(rows => {
      if(rows.length == 0){
        res.status(404).json({error: true, message: "Industry sector not found"})
        return
      }
      res.json(rows)
    })
})

router.get('/:Symbol', function(req, res, next){
  if(Object.keys(req.query).length != 0){
    res.status(400).json({
      error: true,
      message: "Date parameters only available on authenticated route /stocks/authed"
    })
    return
  }
  req.db.from('stocks').select('*').where('symbol','=',req.params.Symbol).orderBy('timestamp','desc')
  .then(row => {
    if(row.length == 0){
      res.status(404).json({
        error: true,
        message: "No entry for symbol in stocks database"
      })
    }
    res.json(row[0])
  })
})

router.get('/authed/:Symbol', authorize, function(req, res, next){
  var query;
  if(req.query.from){
    if(req.query.to){
      query = req.db.from('stocks').select('*').where('symbol','=',req.params.Symbol).andWhere('timestamp','>=',req.query.from).andWhere('timestamp','<=',req.query.to)
    }
    else{
      query = req.db.from('stocks').select('*').where('symbol','=',req.params.Symbol).andWhere('timestamp','>=',req.query.from)
    }
  }
  else if(req.query.to){
    query = req.db.from('stocks').select('*').where('symbol','=',req.params.Symbol).andWhere('timestamp','<=',req.query.to)
  }
  else{
    if(Object.keys(req.query).length != 0){
      res.status(400).json({
        error: true,
        message: "Parameters allowed are 'from' and 'to', example: /stocks/authed/AAL?from=2020-03-15"
      })
      return
    }
    else{
      query = req.db.from('stocks').select('*').where('symbol','=',req.params.Symbol) 
    }
  }

  query
  .then(rows => {
    if(rows.length == 0){
      res.status(404).json({
        error: true,
        message: "No entries available for query symbol for supplied date range"
      })
      return
    }
    res.json(rows)
  })
})

module.exports = router;
