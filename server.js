var http = require("http"),
	express = require('express'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	errorHandler = require('error-handler')
	fs = require('fs-extra');
var mkdirp = require('mkdirp');
var busboy = require('connect-busboy'); //middleware for form/file upload
var path = require('path');     //used for file path
var fs = require('fs-extra');       //File System - for file manipulation
var ObjectID = require('mongodb').ObjectID;
var rmdir = require('rimraf');

var db = require('mongojs').connect('localhost/blog', ['posts']);
var server = express();

// Config
server.use(bodyParser());
server.use(methodOverride());

var basicAuth = require('basic-auth');

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === 'admin' && user.pass === 'haxor') {
    return next();
  } else {
    return unauthorized(res);
  };
};

server.get('/poster', auth, function(req, res, next) {
	next();
});

server.post('/poster/insertpost', auth, function (req, res, next) {
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

server.use(busboy());
server.post('/poster/upload/:id', auth, function(req, res, next) {
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

server.post('/poster/update/:id', auth, function(req, res, next) {

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

server.del('/poster/delete/:id', auth, function(req, res, next) {

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

/**************BLOG APIs**************/

server.use(express.static(__dirname));

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};
server.use(allowCrossDomain);

server.get('/api', function (req, res, next) {
	res.send('Our sample API is up...');
});

server.get('/newestPost', function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	db.posts.find().sort({date: -1}).limit(1, function(err, posts) { // Query in MongoDB via Mongo JS Module
		if( err || !posts) {
			console.log("No posts found");
		} else {
			res.writeHead(200, {'Content-Type': 'application/json'}); // Sending data via json
			str='[';
			posts.forEach( function(post) {
				var date = post.date;
				str = str + '{ "date": "' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()  +
					'"},' + '\n';
			});
			str = str.trim();
			str = str.substring(0, str.length-1);
			str = str + ']';
			console.log(str);
			res.end( str );
		}
	});
});

server.get('/blog/getposts', function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	db.posts.find({}, function(err, posts) { // Query in MongoDB via Mongo JS Module
		if( err || !posts) {
			console.log("No posts found");
		} else {
			res.writeHead(200, {'Content-Type': 'application/json'}); // Sending data via json
			str='[';
			posts.forEach( function(post) {
				var date = post.date;
				str = str + '{ "title" : "' + post.title + 
					'", "friendlyDate": "' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()  +
					'", "date": "' + date.getTime() +
					'", "text": "' + post.text + 
					'", "id": "' + post._id +
					'"},' + '\n';
			});
			str = str.trim();
			str = str.substring(0, str.length-1);
			str = str + ']';
			res.end( str );
				// prepared the JSON array here
		}
	});
});

server.get('/blog/getimages/:dir', function (req, res, next) {
	res.writeHead(200, {'Content-Type': 'application/json'}); // Sending data via json
	fs.readdir("./blog/pictures/" + req.params.dir, function (err, files) {
 	 if (err) throw err;
		str = '[';
		files.forEach(function(element, index, arr) {
			str += '{ "name": "' + element + '"},\n'
		});
		str = str.trim();
		str = str.substring(0, str.length-1);
		str += ']';
		res.end(str);
	});
});

var port = 8080;
server.listen(port, function() {
	console.log('server listening on port ' + port);
});
