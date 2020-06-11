const express = require('express')
const app = express();
const routes = require('./route.js');
const path = require('path')

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));


app.get('/',routes);

app.post('/register',routes);

app.get('/login',routes)

app.post('/login',routes);
app.get('/success',routes);

app.get('/logout',routes)
app.post('/addmsg',routes) 
const port = process.env.port || 5000;
app.listen(port,()=>console.log("Server started at ", port));