const express = require('express');
const routes = express.Router();
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const bycrpt = require('bcryptjs');
const user  = require('./models.js');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
var nodemailer = require('nodemailer');


routes.use(bodyparser.urlencoded({extended:true}));

routes.use(cookieParser('secret'));
routes.use(session({
     secret:'secret',
     maxAge:3600000,
     resave:true,
     saveUninitialized:true,
}))

routes.use(passport.initialize());
routes.use(passport.session());

routes.use(flash());
//Global Variable
routes.use(function(req,res,next){
  res.locals.success_message = req.flash('success_message');
  res.locals.error_message = req.flash('error_message');
  res.locals.error = req.flash('error');
  next(); 
})

const checkAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        return next();
    } else {
        res.redirect('/login');
    }
}



let transporter = nodemailer.createTransport({
    service : 'gmail',
    secure:false,
    port:25,
    auth:{
        user : 'satyamtesting2812@gmail.com',
        pass: 'satyam@2812'
    },
    tis:{
        rejectUnauthorized : false
    }
});





mongoose.connect('mongodb+srv://first:satyam@2812@cluster0-ziri6.mongodb.net/userDB?retryWrites=true&w=majority',{
    useNewUrlParser : true,
    useUnifiedTopology:true
}).then(()=>console.log("Database Connected"));



routes.get('/', (req,res)=>{
    res.render('index');
})

routes.post('/register',(req,res)=>{
  var {email , username, password, confirmpassword} = req.body;
  var err;
  if(!email|| !username || !password || !confirmpassword)
  {
      err = "Please Fill All the Field";
      res.render('index',{'err':err});

  }

   if(password != confirmpassword)
   {
       err = "Password Don't Match";
       res.render('index',{'err':err,'email':email, 'username':username})
       }
  
   if(typeof err =='undefined'){
       user.findOne({email:email}, function(err,data){
           if(data)
           {
               console.log("User Exists");
               err = "User Already Exists With This Email Id";
               res.render('index',{'err':err, 'email':email, 'username': username});
           }else{
               bycrpt.genSalt(10,(err,salt)=>{
                   if(err)
                   throw err;
                   bycrpt.hash(password,salt, (err,hash)=>{
                       if(err) throw err;
                       password = hash;
                       user({
                           email,
                           username,
                           password
                       }).save((err,data)=>{
                           if(err) throw err;
                           req.flash('success_message',"Registred Successfully.. Login To Continue");
                        
                        
                           let HelperOptions = {
                            from : '"Satyam Sharma" <satyamtesting2812@gmail.com',
                            to : email,
                            subject: 'Testing Message',
                            text : 'Thanks For Registration on our site' 
                        };

  
                        transporter.sendMail(HelperOptions,(err,info)=>{
                             if(err){
                          return console.log(err);
                              }
                   console.log("This Message Was Sent");
                           console.log(info);

})

                          



                           res.redirect('/login');
                       });
                   })
               })
           }
       })
   }
});


// authecation strategy 
var localStrategy = require('passport-local').Strategy;
passport.use(new localStrategy({usernameField: 'email'},(email,password,done)=>{
user.findOne({email: email},(err,data)=>{
    if(err) throw err;
    if(!data){
        return done(null,false,{message : "Username Doesn't Exists..."});
    }
    bycrpt.compare(password,data.password,(err,match)=>{
        if(err){
            return done(null,false);
        }
        if(!match){
            return done(null,false,{message : "Password Doesn't Match "});
        }
        if(match){
            return done(null,data);
        }
    })
})
}));

passport.serializeUser(function(user,cb){
    cb(null,user.id);
})

passport.deserializeUser(function(id,cb){
    user.findById(id,function(err,user){
        cb(err,user);
    })
})

//end of authication stragey

routes.get('/login',(req,res)=>{
res.render('login');
});

routes.post('/login',(req,res,next)=>{
    passport.authenticate('local',{
        failureRedirect:'/login',
     successRedirect:'/success',        
      failureFlash:true,
    })(req,res,next);
});


routes.get('/success', checkAuthenticated ,(req,res)=>{
    res.render('success',{'user': req.user});
})

routes.get('/logout',(req,res)=>
{
    req.logout();
    res.redirect('/login')
})

routes.post('/addmsg', checkAuthenticated ,(req,res)=>{
   user.findOneAndUpdate(
       {email:req.user.email},
       {$push :{
           messages : req.body['msg']
       }},(err,suc)=>{
           if(err) throw err;
           if(suc) console.log("Added Succesfully");
       }
   )
   res.redirect('/success');
});

module.exports = routes;