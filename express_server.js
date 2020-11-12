const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const saltRounds = 10; //bcrypt rounds

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "6znqm0" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "3wm315" },
  idsfsd: { longURL: "https://www.reddit.com", userID: "3wm315" }
};

const users = {
  // "userRandomID": {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "purple-monkey-dinosaur"
  // },
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

const checkEmailPass = (database, email, password)=>{
  for (let user in database) {
    console.log(user);
    if (database[user].email === email) {

      console.log('bcrypt :', bcrypt.compareSync(password, database[user].password))
      if (bcrypt.compareSync(password, database[user].password)) {
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

const urlsForUser = (id, database)=> {
  let userLinks = {}
  for (link in database){
    if(database[link].userID === id){
      userLinks[link] = {longURL: database[link].longURL,userID: database[link].userID }
    };
  };
  return userLinks;
}

const generateRandomString = ()=> {
  const result = Math.random().toString(36).substring(2,8);
  return result;
};

app.get("/urls", (req,res)=> {
  if(req.cookies["user_id"]) {
    let userID = req.cookies["user_id"].id
    let userLinks = urlsForUser(userID, urlDatabase);

    const templateVars = {
      urls: userLinks,
      user_id: req.cookies["user_id"]
    };
    res.render("urls_index", templateVars);
  } else {
      const templateVars = {
      urls: null,
      user_id: req.cookies["user_id"]
    };
    res.render("urls_index", templateVars);}
});

app.get("/u/:shortURL", (req, res)=> {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls", (req, res)=> {
  const url = req.body;
  let longURL = url.longURL;
  let ranId = generateRandomString();
  console.log(req.body);
  urlDatabase[ranId] = {longURL, userID:  req.cookies["user_id"].id};   
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
  if(req.cookies["user_id"]){
    let sUrl = req.params.shortURL;
    let id = req.cookies["user_id"].id
    let idURL = urlDatabase[sUrl].userID
    console.log("sUrl: ", sUrl)
    if(id === idURL) {
      console.log(req.body);
      urlDatabase[sUrl].longURL = req.body.newUrl;
      res.redirect(`/urls`);
    }
  }
});

app.post("/urls/:shortURL/delete", (req, res)=> {
  if(req.cookies["user_id"]){
    let sUrl = req.params.shortURL;
    let id = req.cookies["user_id"].id
    let idURL = urlDatabase[sUrl].userID
      if(id === idURL) {
        console.log(req.body);
        delete urlDatabase[sUrl];
      }
    }
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
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  users[ranUserId] = {id: ranUserId, email, password: hashedPassword};
  console.log('regitered', users)
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