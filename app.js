const express = require("express");
require("express-async-errors");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");
//to access env variables
require("dotenv").config();
//routes
const secretWordRouter = require("./routes/secretWord");
const jobRouter = require("./routes/jobs");
//middleware
const auth = require("./middleware/auth");
//to manage user sessions
const session = require("express-session");

//express
const app = express();
//sets view engine to EJS
app.set("view engine", "ejs");
//parses incoming requests
app.use(require("body-parser").urlencoded({ extended: true }));

//records session in mongo database
const MongoDBStore = require("connect-mongodb-session")(session);
let url = process.env.MONGO_URI;
//if testing change to testing database
if (process.env.NODE_ENV == "test") {
  mongoURL = process.env.MONGO_URI_TEST;
}
const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: url,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

//setting configration for user session
const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

//if running in production enhance security
if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

//Enable session management
app.use(session(sessionParms));

//enables flash messages
app.use(require("connect-flash")());
//import passport
const passport = require("passport");
//import passport initialization info
const passportInit = require("./passport/passportInit");
//executes
passportInit();
//initialize passport for middleware for handling authentication
app.use(passport.initialize());
//persists login session
app.use(passport.session());

//handling security attacks with csrf protection
const csrf = require("host-csrf");
const cookieParser = require("cookie-parser");
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.urlencoded({ extended: false }));
let csrf_development_mode = true;
if (app.get("env") === "production") {
  csrf_development_mode = false;
  app.set("trust proxy", 1);
}

app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use(helmet());
app.use(xss());
const csrf_options = {
  protected_operations: ["PATCH"],
  protected_content_types: ["application/json"],
  development_mode: csrf_development_mode,
};

app.use(csrf(csrf_options));
app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));

app.use("/secretWord", secretWordRouter);

app.use("/secretWord", auth, secretWordRouter);

app.use("/jobs", auth, jobRouter);

//fixing content type response error
app.use((req, res, next) => {
  if (req.path == "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});

app.get("/multiply", (req, res) => {
  const result = req.query.first * req.query.second;
  if (result.isNaN) {
    result = "NaN";
  } else if (result == null) {
    result = "null";
  }
  res.json({ result: result });
});

//handles any routes that don't exist
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

//handles unexpected server side errors during req/res cycle
app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

//setting port
const port = process.env.PORT || 3000;

//now synchronous
const start = async () => {
  try {
    require("./db/connect")(process.env.MONGO_URI);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };
