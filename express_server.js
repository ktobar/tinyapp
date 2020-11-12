const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "blahblah" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "blahblah": {
    id: "blahblah",
    email: "my@my.my",
    password: "my"
  }
};

const checkEmailPass = (database, email, password)=>{
  for (let user in database) {
    console.log(user);
    if (database[user].email === email) {
      if (database[user].password === password) {
        return {error: null, user};
      } else {
        return {error: "password", user: null};
      }
    }
  }
  return false;
};

const emailCheck = (database, email)=> {
  for (let user in database) {
    console.log(user);
    if (database[user].email === email) {
      return true;
    }
  }
  return false;
};

const generateRandomString = ()=> {
  const result = Math.random().toString(36).substring(2,8);
  return result;
};

app.get("/urls", (req,res)=> {
  const templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"]
  };
  res.render("urls_index", templateVars);
});

app.get("/u/:shortURL", (req, res)=> {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls", (req, res)=> {
  const url = req.body;
  let bigURL = url.longURL;
  let ranId = generateRandomString();
  console.log(req.body);
  urlDatabase[ranId] = bigURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${ranId}`);
});

app.get("/urls/new", (req,res)=> {
  const templateVars = {
    user_id: req.cookies["user_id"]
  };
  if(req.cookies["user_id"]){
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login')
  }
});

app.post("/urls/:shortURL/edit", (req, res)=> {
  let sUrl = req.params.shortURL;
  console.log(req.body);
  urlDatabase[sUrl] = req.body.newUrl;
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL/delete", (req, res)=> {
  let url = req.params.shortURL;
  delete urlDatabase[url];
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req,res)=> {

  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = {
    shortURL,
    longURL,
    user_id: req.cookies["user_id"]
  };
  res.render("urls_show", templateVars);
});


app.get("/register", (req, res) => {
  const templateVars = {
    user_id: req.cookies["user_id"]
  };
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user_id: req.cookies["user_id"]
  };
  res.render("urls_login",templateVars);
});

app.post("/login", (req, res)=> {
  console.log(req.body);
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    console.log('firsterror');
    return res.status(400).send('<h2>Empty Input</h2>');
  }
  
  if (checkEmailPass(users, req.body.email, req.body.password).error) {
    console.log('2nderror');
    return res.status(400).send('<h2>Email or Password does not match</h2>');
  }
  let dUser = checkEmailPass(users, req.body.email, req.body.password).user;
  res.cookie("user_id", users[dUser]);
  
  res.redirect("/urls");
});
app.post("/logout", (req,res)=> {
  res.clearCookie('user_id');
  res.redirect("/urls");
});
////////////////////////////////////////////////////////////////
app.post("/register", (req,res)=> {
  let ranUserId = generateRandomString();
  console.log(req.body);
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    console.log('firsterror');
    return res.status(400).send('<h2>Empty Input</h2>');
  }
  const {email, password} = req.body;
  console.log(`usersdb; ${users} , email: ${email}`);
  
  if (emailCheck(users, email)) {
    console.log('2nderror');
    return res.status(400).send('<h2>Email already used</h2>');
  }

  users[ranUserId] = {id: ranUserId, email, password};
  res.cookie("user_id", users[ranUserId]);

  res.redirect("/register");
});

app.get("/", (req, res)=> {
  res.send('Hello!');
});

app.get("/urls.json", (req, res)=> {
  res.json(urlDatabase);
});

app.get("/hello", (req, res)=> {
  res.send("<html><body>Hello <b>World</b></body</html>\n");
});

app.listen(PORT, ()=> {
  console.log(`Example app listening on port ${PORT}!`);
});