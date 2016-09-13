/*-------------------------------*/
// INITIALIZE EXPRESS
/*-------------------------------*/

var express          = require("express"),
    mongoose         = require("mongoose"),
    bodyParser       = require("body-parser"),
    expressSanitizer = require("express-sanitizer"),
    methodOverride   = require('method-override');

var app = express();


/*-------------------------------*/
// APP CONFIG
/*-------------------------------*/
/*override with POST having ?_method=PUT OR ?_method=DELETE*/
app.use(methodOverride('_method'));

/* Tell express to serve the contents of the public directory */
app.use(express.static("public"));


/* Template Engine*/
/* EJS - Tell express the file extension of your view/template engine so 
you don’t have to type .ejs all the time*/
app.set("view engine", "ejs");

/* body-parser - for html-forms post routes*/
app.use(bodyParser.urlencoded({
    extended: true
}));

/*SANITIZE - must go after body parser*/
app.use(expressSanitizer());

/*-------------------------------*/
// DATABASE
/*-------------------------------*/

// Build the connection string 
//URI (Uniform Resource Identifier)
var dbURI = "mongodb://localhost/blogapp";

//create the database connection
mongoose.connect(dbURI);

/****** CONNECTION EVENTS 
 *  Remember these are event handers - asynch...
 * 
 */
// When successfully connected...
mongoose.connection.on("connected", function() {
    console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on("error", function(err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on("disconnected", function() {
    console.log('Mongoose default connection disconnected');
});


/*Define the SCHEMA*/
/*Interesting: This is how you default a column */
var blogSchema = mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {
        type: Date,
        default: Date.now
    }
});


/*Build The Model*/
var Blog = mongoose.model("Blog", blogSchema);

/*Temporary Data Setup*/
var createTestData = false;
if (createTestData) {
    Blog.remove({}, function(err) {
        if (err) {
            console.log("Error Removing test Data: " + err);
        }
        else {
            console.log("Removed All Test Data...");
        }
    });
    
    var blogTestData = [{
        title: "Hard at Work",
        image: "http://image.shutterstock.com/z/stock-vector-professional-programmer-working-writing-code-at-his-big-desk-with-multiple-displays-and-laptop-390754486.jpg",
        body: "I have been doing the career 2.0 thing for a long time Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptate, maxime, animi aperiam quis sunt error similique inventore impedit officiis placeat cupiditate eaque cumque aliquam delectus quibusdam nemo molestiae accusamus eveniet.",
    }, {
        title: "Would Rather be windsurfing",
        image: "http://www.sail-world.com/photos/sail-world/photos_2013_1/Alt_DAY%202%20WEBSIZE7.jpg",
        body: "<h1>Sigh...</h1>I would love to do this every day",
    }, {
        title: "Moving to Merritt Island",
        image: "https://s-media-cache-ak0.pinimg.com/736x/25/97/d2/2597d2247ab01f4728747550930b2434.jpg",
        body: "Some Day <strong>Soon</strong> we will live here",
    }];

    Blog.create(blogTestData, function(err, testBlogs) {
        if (err) {
            console.log("Error creating New Data...");
            console.log(err);
        }
        else {
            console.log("SUCCESS creating New Data...");
            console.log(testBlogs);
        }
    });
} //if (createTestData)

/*-------------------------------*/
// SETUP ROUTES
/*-------------------------------*/
/*
Name |  Path/Url  |	HTTP Verb | Mongoose Method
-------------------------------------------------
[List all things]
Index	/things	         GET	Thing.find()
-------------------------------------------------
[ new thing form]
New	    /things/new	     GET	 N/A
------------------------------------------------- 
[Create a new thing, then redirect somewhere]
Create	/things	         POST	 Thing.create()
-------------------------------------------------  
[Show info about one specific thing]
Show	/things/:id	     GET	 Thing.findById()
-------------------------------------------------
[Show edit form for one thing]
Edit	/things/:id/edit GET	 Thing.findById()
-------------------------------------------------  
[Update particular thing, then redirect somewhere]
Update	/things/:id	     PUT	 Thing.findByIdAndUpdate()
------------------------------------------------- 
[Delete a particular thing, then redirect somewhere]
Destroy	/things/:id	     DELETE	  Thing.findByIdAndRemove()
  
*/

//INDEX ROUTE-----------------------------------
app.get("/blogs", function(req, res) {
    
    Blog.find({},function(err,blogs) {
        if (err) {
            console.log("Error in INDEX route: " + err);
        } else {
            res.render("index",{ blogs: blogs });
        }
    });
});

/* conventional for the root page to go to the index */
app.get("/", function(req,res){
   res.redirect("/blogs"); 
});


//NEW ROUTE-------------------------------------
app.get("/blogs/new",function(req, res) {
    res.render('new');
});

//CREATE ROUTE-------------------------------------
app.post("/blogs",function (req,res) {
    //dont forget this ties into body-parser
    
    req.body.blog.body = req.sanitize(req.body.blog.body);
    
    Blog.create(req.body.blog,function (err,newBlog) {
        if(err){
            console.log(err);
            res.render("new");
        }else{
            console.log("Added new Blog Entry: " + newBlog);
            res.redirect("/blogs");
        }
    });
    
});

/* SHOW ROUTE
[Show info about one specific thing]
Show	/things/:id	     GET	 Thing.findById()
*/
app.get("/blogs/:id",function(req, res) {
    var blogId = req.params.id;
    
    Blog.findById(req.params.id,function(err,foundBlog){
       if(err){
            var errMsg = "Error in SHOW ROUTE: " + err;
            console.log(errMsg);
            res.send(errMsg);
       }else{
           //console.log("Show Route: " + foundBlog._id);
           console.log("Show Route: " + req.params.id);
           res.render("show",{blog: foundBlog});
       }
    });
    
    
});


//EDIT ROUTE
app.get("/blogs/:id/edit",function(req, res) {
    var blogId = req.params.id;
    
    Blog.findById(blogId,(function(err,foundBlog) {
        
        if(err){
            var errMsg = "Error in edit Route: " + err;
            console.log(errMsg);
            res.send(errMsg);
        }else{
            console.log("Edit Route: " + foundBlog._id);
            //console.log("Edit Route: " +  req.params.id);
            res.render("edit",{blog: foundBlog});
        }
    }));
    
}) ; 



/* PUT ROUTE
[Update particular thing, then redirect somewhere]
Update	/things/:id	     PUT	 Thing.findByIdAndUpdate()
*/
app.put("/blogs/:id",function(req,res) {
    
    //console.log(req.body.blog.body);
    req.body.blog.body = req.sanitize(req.body.blog.body);
    //console.log(req.body.blog.body);
   
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err,blogToUpdate) {
        if(err){
            var errMsg = "Error in PUT Route: " + err;
            console.log(errMsg);
            //res.redirect("/blogs");
            res.send(errMsg);
        }else{
            console.log("PUT Route: " + blogToUpdate._id);
            res.redirect("/blogs/" + req.params.id);
        }
    });
    
});

/*DELETE Route
[Delete a particular thing, then redirect somewhere]
Destroy	/things/:id	     DELETE	  Thing.findByIdAndRemove()
*/
app.delete('/blogs/:id',function(req,res) {
  
  //res.send("Welcome to the Delete route...");
   Blog.findByIdAndRemove(req.params.id,function(err){
      if (err) {
          var errMsg = "Error in DELETE Route: " + err;
          console.log(errMsg);
          res.send(errMsg);
      } else {
          console.log("DELETE Route: " + req.params.id);
          res.redirect("/");
      } 
   });
});

/*-------------------------------*/
// INITIALIZE SERVER
/*-------------------------------*/
/* Cloud9 specific settings 
   https://udemy-webdevbootcamp-dderocher.c9users.io
	process.env.PORT, process.env.IP,
*/

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("The Blog APP server has started...");
});
