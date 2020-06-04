var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const options = require('./knexfile');
const knex = require('knex')(options);
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const helmet = require('helmet');
yaml = require('yamljs');
swaggerDocument = yaml.load('./swagger.yaml');

var stocksRouter = require('./routes/stocks');
var usersRouter = require('./routes/user');

var app = express();

app.use((req, res, next) => {
  req.db = knex;
  next();
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(helmet());
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/stocks', stocksRouter);
app.use('/user', usersRouter);
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
