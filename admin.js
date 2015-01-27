var http = require('http');
var auth = require('basic-auth');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var mkdirp = require('mkdirp');
var busboy = require('connect-busboy'); //middleware for form/file upload
var path = require('path');     //used for file path
var fs = require('fs-extra');       //File System - for file manipulation
var ObjectID = require('mongodb').ObjectID;
var rmdir = require('rimraf');

//app.use(express.static(__dirname + '/admin'));
app.use(bodyParser());
var db = require('mongojs').connect('localhost/blog', ['posts']);

app.use(function(req, res, next) {
    var user = auth(req);

    if (user === undefined || user['name'] !== 'admin' || user['pass'] !== 'haxor') {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
        res.end('Unauthorized');
    } else {
        next();
    }
});

app.use(express.static(__dirname + '/poster'));

app.post('/insertpost', function (req, res, next) {
  console.log("POST: ");
  console.log(req.body);
  var jsonData = req.body;

	var today = new Date();
	db.posts.save({title: jsonData.title, date: today, text: jsonData.text},
    function(err, saved) {
      if( err || !saved ) { 
				console.log("ERROR: post not saved, it probably exists already");
        res.status(500).send( "Post not saved");
      } else {
				db.posts.find({date: today},
				function(err, posts) {
					if (err || posts[0] == null) {
						res.end( "Couldn't find post with date: " + date);
					} else {
						var id = posts[0]._id.toString();
						console.log("Creating folder at: /var/www/future_html/blog/pictures/" + id);
						mkdirp(__dirname + '/blog/pictures/' + id, function(err) { 
					    if(err) console.log( err );
						});
        		res.end( "" + id );
					}
      	});   
    	}
		}   
  );  
});

app.use(busboy());
app.post('/upload/:id', function(req, res, next) {
	var fstream;
	var files = [];
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
  	console.log("Uploading: " + filename);

    //Path where image will be uploaded
    fstream = fs.createWriteStream(__dirname + '/blog/pictures/' + req.params.id  + "/"  + filename);
    file.pipe(fstream);
    fstream.on('close', function () {    
			var endMessage = "Upload Finished of " + filename;
    	console.log(endMessage);           
			files.push(filename);   
    });
		fstream.on('error', function(err) {
  		console.log("ERROR:" + err);
  		file.read();
		});
  });

	req.busboy.on('finish', function(){
  	console.log('finish, files uploaded ', files);
    res.status(200).send();
  });

});

app.post('/update/:id', function(req, res, next) {

  console.log("Updating post with id: " + req.params.id);
  console.log("\nData: \n" + req.body);
  var jsonData = req.body;

	var altTitle, altText, altDate;

	db.posts.find({_id: ObjectID(req.params.id)}, function(err, data) {
		if(err) {
			console.log(err);
			next();
		}
		console.log(data);
		data.forEach(function(element) {
			altTitle = element.title;
			altText = element.text;
			altDate = element.date;
		});
	});

	if(altDate == null || altdate == undefined)
		altDate = new Date();

	if(jsonData.title == '' || jsonData.title == null) {
		jsonData.title = altTitle;
	}
	if(jsonData.text =='' || jsonData.text == null) {
		jsonData.text = altText;
	}	
	db.posts.update({_id: ObjectID(req.params.id)}, {title: jsonData.title, text: jsonData.text, date: altDate},
		function(err, count, stat) {
			if(err) {
				console.log( err );
				res.status(400).send();
				next();
			} else if(count > 0) {
				console.log("Post was updated successfully!");
				res.status(200).send();	
			} else {
				console.log("No errors occurred");
				res.status(200).send();
			}
		}
	);

});

app.del('/delete/:id', function(req, res, next) {

  console.log("Deleting post with id: " + req.params.id);
  var jsonData = req.body;

	var altTitle, altText, altDate;

	db.posts.remove({_id: ObjectID(req.params.id)}, function(err, data) {
		if(err) {
			console.log(err);
			next();
		}
		console.log(data);
	});

	db.posts.remove({_id: ObjectID(req.params.id)},
		function(err) {
			if(err) {
				console.log( err );
				res.status(400).send();
				next();
			} else {

				var path = __dirname + '/blog/pictures/' + req.params.id;
				console.log("Deleting contents in path: " + path);
				rmdir(path, function(error) {
					if(error) {
						console.log(err);
						res.status(400).send();
					}
				});

				console.log("Post was successfully deleted!");
				res.status(200).send();	
			} 
		}
	);

});

app.listen(1337);
