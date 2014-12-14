var http = require("http"),
	express = require('express'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	errorHandler = require('error-handler')
	fs = require('fs');

var db = require('mongojs').connect('localhost/blog', ['posts']);
var server = express();

// Config
server.use(bodyParser());
server.use(methodOverride());
server.use(express.static(__dirname + '/blog'));
//server.use(errorHandler({ dumpExceptions: true, showStack: true}));

server.get('/api', function (req, res, next) {
	res.send('Our sample API is up...');
});

server.get('/getposts', function (req, res, next) {
	db.posts.find({}, function(err, posts) { // Query in MongoDB via Mongo JS Module
		if( err || !posts) {
			console.log("No posts found");
		} else {
			res.writeHead(200, {'Content-Type': 'application/json'}); // Sending data via json
			str='[';
			posts.forEach( function(post) {
				var date = post.date;
				str = str + '{ "title" : "' + post.title + 
					'", "date": "' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()  +
					'", "text": "' + post.text + 
					'", "id": "' + post._id +
					'"},' + '\n';
			});
			str = str.trim();
			str = str.trim();
			str = str.substring(0, str.length-1);
			str = str + ']';
			res.end( str );
				// prepared the JSON array here
		}
	});
});

server.get('/getimage/:dir', function (req, res, next) {
	res.writeHead(200, {'Content-Type': 'application/json'}); // Sending data via json
	fs.readdir("blog/pictures/" + req.params.dir, function (err, files) {
 	 if (err) throw err;
		res.end('{ "name": "' + files[0] + '"}');
	});
});

server.post('/insertpost', function (req, res, next) {
	console.log("POST: ");
	res.header("Access-Control-Allow-Origin", "http://localhost");
	res.header("Access-Control-Allow-Methods", "GET, POST");
	// The above 2 lines are required for Cross Domain Communication(Allowing the methods that come as
	// Cross Domain Request
	console.log(req.body);
	var jsonData = JSON.parse(req.body);

	db.posts.save({title: jsonData.title, date: jsonData.date, text: jsonData.text},
		function(err, saved) {
			if( err || !saved ) {
				res.end( "User not saved");
			} else {
				res.end( "User saved" );
			}
		}
	);
});

var port = 2015;
server.listen(port, function() {
	console.log('server listening on port ' + port);
});

