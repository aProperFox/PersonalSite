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
					'", "date": "' + (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()  +
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

var port = 2015;
server.listen(port, function() {
	console.log('server listening on port ' + port);
});
