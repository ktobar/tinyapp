const bcrypt = require('bcrypt');

const checkEmailPass = (email, password, database)=>{
  for (let user in database) {
    console.log(user);
    if (database[user].email === email) {
      // console.log('bcrypt :', bcrypt.compareSync(password, database[user].password))
      if (bcrypt.compareSync(password, database[user].password)) {
        return {error: null, user};
      } else {
        return {error: "password", user: null};
      }
    }
  }
  return false;
};

const getUserByEmail = (email, database)=> {
  for (let user in database) {
    console.log(user);
    if (database[user].email === email) {
      return {error: null, user};
    }
  }
  return {error: "user", user: null};
};

const urlsForUser = (id, database)=> {
  let userLinks = {};
  for (let link in database) {
    if (database[link].userID === id) {
      userLinks[link] = {longURL: database[link].longURL,userID: database[link].userID };
    }
  }
  return userLinks;
};

const generateRandomString = ()=> {
  const result = Math.random().toString(36).substring(2,8);
  return result;
};

module.exports = {checkEmailPass, getUserByEmail, urlsForUser, generateRandomString};