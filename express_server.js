const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  const result = Math.random().toString(36).substring(2,8)
  return result;
}

app.get("/urls", (req,res)=> {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
})

// app.post("/urls", (req, res)=> {
//   console.log(req.body);
//   res.send("Ok");
// })

app.get("/u/:shortURL", (req, res)=> {
  let shortURL = req.params.shortURL 
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
})

app.post("/urls", (req, res)=> {
  const url = req.body;
  let bigURL = url.longURL
  let ranId = generateRandomString();
  console.log(req.body);
  urlDatabase[ranId] = bigURL
  console.log(urlDatabase)
  res.redirect(`/urls/${ranId}`);
})

app.get("/urls/new", (req,res)=> {
  res.render("urls_new");
})

app.get("/urls/:shortURL", (req,res)=> {

  const shortURL = req.params.shortURL
  const longURL = urlDatabase[shortURL]
  const templateVars = {shortURL, longURL};
  res.render("urls_show", templateVars)
})

app.get("/", (req, res)=> {
  res.send('Hello!');
});

app.get("/urls.json", (req, res)=> {
  res.json(urlDatabase);
})

app.get("/hello", (req, res)=> {
  res.send("<html><body>Hello <b>World</b></body</html>\n")
});

app.listen(PORT, ()=> {
  console.log(`Example app listening on port ${PORT}!`);
});