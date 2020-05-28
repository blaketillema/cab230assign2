var express = require('express');
var bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken')
var router = express.Router();
const swaggerUi = require('swagger-ui-express');
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

router.get('/stocks/symbols/', function(req, res, next){
  console.log(req.query.industry)
  req.db.from('stocks').select('name', 'symbol', 'industry').where('industry','like','%'+req.query.industry+'%').distinct()
  .then(rows => {
    res.json(rows)
  })
  .catch(err => {
    console.log(err);
    res.json({"Error": true, "Message": err})
  })
})

router.get('/stocks/:Symbol', function(req, res, next){
  req.db.from('stocks').select('*').where('symbol','=',req.params.Symbol)
  .then(row => {
    res.json(row[0])
  })
  .catch(err => {
    console.log(err)
    res.json({"Error": true, "Message": err})
  })
})

router.get('/stocks/authed/:Symbol', authorize, function(req, res, next){
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

router.post('/user/register', function(req, res, next){
  const email = req.body.email;
  const password = req.body.password;
  if(!email || !password){
    res.status(400).json({
      error: true,
      message: "Invalid register body"
    })
    return;
  }
  req.db.from('users').select('*').where('email','=',email)
  .then(users => {
    if(users.length > 0){
      console.log("user exists")
      return;
    }
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    return req.db.from('users').insert({email, hash})
  })
  .then(() => {
    res.status(201).json({success: true, message: 'User created'})
  })
})

router.post('/user/login', function(req, res, next){
  const email = req.body.email;
  const password = req.body.password;
  if(!email || !password){
    res.status(400).json({
      error: true,
      message: "Invalid login body"
    })
    return;
  }
  req.db.from('users').select('*').where('email','=',email)
  .then(users => {
    if(users.length == 0){
      console.log('User does not exist')
      return;
    }
    console.log('User exists')
    const user = users[0]
    return bcrypt.compare(password, user.hash)
  })
  .then(match => {
    if(!match){
      console.log("Passwords don't match")
      return
    }
    console.log("Passwords match")
    const expires_in = 60*60*24;
    const exp = Math.floor(Date.now() / 1000) + expires_in;
    const token = jwt.sign({email, exp}, secretKey)
    res.json({ token_type: "Bearer", token, expires_in})
  })
})

module.exports = router;
