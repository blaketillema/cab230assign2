var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken')
const secretKey = "secret key"


router.post('/register', function(req, res, next){
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
      res.status(409).json({
        error: true,
        message: "User already exists"
      })
      return 409
    }
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    return req.db.from('users').insert({email, hash})
  })
  .then(state => {
    if(state == 409){
      return
    }
    else{
      res.status(201).json({
        success: true, 
        message: 'User created'
      })
    }
  })
})

router.post('/login', function(req, res, next){
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
      res.status(401).json({
        error: true,
        message: "User doesn't exist"
      })
      return 401
    }
    const user = users[0]
    return bcrypt.compare(password, user.hash)
  })
  .then(match => {
    if(match == 401){
      return
    }
    if(!match){
      res.status(401).json({
        error: true,
        message: "Passwords don't match"
      })
      return
    }
    const expires_in = 60*60*24;
    const exp = Math.floor(Date.now() / 1000) + expires_in;
    const token = jwt.sign({email, exp}, secretKey)
    res.json({ token_type: "Bearer", token, expires_in})
  })
})

module.exports = router;
