const express = require("express");
const app = express();
const PORT = 8080;
//middleware
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
//helper fuctions
const {checkEmailPass, getUserByEmail, urlsForUser, generateRandomString} = require('./helpers');

//middleware settings
const saltRounds = 10; //bcrypt rounds
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
//allows for uses of templates
app.set("view engine", "ejs");

//user and url databases
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "6znqm0" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "3wm315" },
  idsfsd: { longURL: "https://www.reddit.com", userID: "3wm315" }
};

const users = {
  '3wm315':
  { id: '3wm315',
    email: 'my@my.my',
    password:
     '$2b$10$C8fepUyUF7CltMmdNwXW7OqO3ulQPo7/5Moce5g6Co4nvyZRuP3IK'
  },
  '6znqm0': {
    id: '6znqm0',
    email: 'go@go.com',
    password:
     '$2b$10$Z8sdaLtureVa4AxCSrcu6uk..ty1AObBzUT78fhmvrJyrup/4PwIi'
  }
};
//Display list of URLs only by owner login
app.get("/urls", (req,res)=> {
  let reqScookies = req.session['user_id'];
  
  if (reqScookies) {
    let userID = req.session['user_id'].id;
    let userLinks = urlsForUser(userID, urlDatabase);

    const templateVars = {
      urls: userLinks,
      user_id: req.session['user_id'],
      error: null
    };
    
    res.render("urls_index", templateVars);
  } else {

    const templateVars = {
      urls: null,
      user_id: null,
      error: "Please Login"
    };
    res.status(401);
    res.render("urls_index", templateVars);
  }
});
//Redirect from shortURL to link stored in
app.get("/u/:shortURL", (req, res)=> {
  let shortURL = req.params.shortURL;
  for (let url in urlDatabase) {
    if (shortURL === url) {
      let longURL = urlDatabase[shortURL].longURL;
      return res.redirect(longURL);
    }
  }
  return res.status(404).send("<html><body><h2>URL not found</h2></body</html>\n");
});
//Creates new link with random id
app.post("/urls", (req, res)=> {
  let longURL = req.body.longURL;
  let ranId = generateRandomString();
  urlDatabase[ranId] = {longURL, userID: req.session['user_id'].id};
  res.redirect(`/urls/${ranId}`);
});
//Create URL page only for logged in user
app.get("/urls/new", (req,res)=> {
  const templateVars = {
    user_id: req.session['user_id']
  };
  if (req.session['user_id']) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});
//Only user, owner of link could edit url
app.post("/urls/:shortURL/edit", (req, res)=> {
  if (req.session['user_id']) {
    let sUrl = req.params.shortURL;
    let id = req.session['user_id'].id;
    let idURL = urlDatabase[sUrl].userID;
    if (id === idURL) {
      urlDatabase[sUrl].longURL = req.body.newUrl;
      res.redirect(`/urls`);
    }
  }
});
//Only user, owner of link could delete url
app.post("/urls/:shortURL/delete", (req, res)=> {
  if (req.session['user_id']) {
    let sUrl = req.params.shortURL;
    let id = req.session['user_id'].id;
    let idURL = urlDatabase[sUrl].userID;
    if (id === idURL) {
      delete urlDatabase[sUrl];
    }
  }
  res.redirect("/urls");
});
//displays value of shortURL only to the owner, else login require
app.get("/urls/:shortURL", (req,res)=> {
  let reqScookies = req.session['user_id'];
  
  if (reqScookies) {
    if (reqScookies.id !== urlDatabase[req.params.shortURL].userID) {
      const templateVars = {
        shortURL: null,
        longURL: null,
        user_id: req.session['user_id'],
        error: "Short URL does not belong to this user"
      };
      res.status(401);
      return res.render("urls_index", templateVars);
    }
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user_id: req.session['user_id'],
      error: null
    };
    return res.render("urls_show", templateVars);
  } else {

    const templateVars = {
      shortURL: null,
      longURL: null,
      user_id: null,
      error: "Please Login"
    };
    res.status(401);
    return res.render("urls_index", templateVars);
  }
});
//registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user_id: req.session['user_id']
  };
  res.render("urls_registration", templateVars);
});
//login page and created cookie when logged in
app.get("/login", (req, res) => {
  const templateVars = {
    user_id: req.session['user_id']
  };
  res.render("urls_login",templateVars);
});
//login verification
app.post("/login", (req, res)=> {
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    return res.status(400).send('<h2>Empty Input</h2>');
  }
  
  if (checkEmailPass(req.body.email, req.body.password, users).error) {
    return res.status(400).send('<h2>Email or Password does not match</h2>');
  }
  let dUser = checkEmailPass(req.body.email, req.body.password, users).user;
  req.session["user_id"] = users[dUser];
  
  res.redirect("/urls");
});
//logout with clearing cookies
app.post("/logout", (req,res)=> {
  req.session = null;
  res.redirect("/urls");
});
//registers only when valid inputs and email does not already exist
app.post("/register", (req,res)=> {
  let ranUserId = generateRandomString();

  if (req.body.email.length === 0 || req.body.password.length === 0) {

    return res.status(400).send('<h2>Empty Input</h2>');
  }
  const {email, password} = req.body;
  
  if (getUserByEmail(email, users).user) {
    return res.status(400).send('<h2>Email already used</h2>');
  }

  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  users[ranUserId] = {id: ranUserId, email, password: hashedPassword};

  req.session["user_id"] = users[ranUserId];

  res.redirect("/urls");
});
//first day material before above codes fell on top
app.get("/", (req, res)=> {
  res.send('Hello!');
});

app.get("/urls.json", (req, res)=> {
  res.json(urlDatabase);
});

app.get("/hello", (req, res)=> {
  res.send("<html><body>Hello <b>World</b></body</html>\n");
});
//shows dev server is up
app.listen(PORT, ()=> {
  console.log(`Example app listening on port ${PORT}!`);
});