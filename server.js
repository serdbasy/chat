var mongoose = require("mongoose"),
	express = require('express'),
	app = express(),
	server = require('http').Server(app),
	io = require('socket.io').listen(server),
	bodyParser = require("body-parser");

app.use(express.static(__dirname, {index: "index.html"}));
app.use(bodyParser.json());
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
	if ('OPTIONS' == req.method){
		return res.send(200);
	}
	next();
});

mongoose.connect("mongodb://localhost:27017/chat");

var userSchema = new mongoose.Schema({
	email: String
}, {versionKey: false});

var messageSchema = new mongoose.Schema({
	sender: String,
	receiver : String,
	message : String
}, {versionKey: false});

var User = mongoose.model('User', userSchema);
var Chat = mongoose.model('Chat', messageSchema);

app.post('/user/add', function(req, res){
	res.set("Content-Type","application/json;charset=UTF-8");
	var body = req.body || {};
	if(body.email && body.email != ''){
		User.findOne({email:body.email}, function (err, user) {
			if (err) throw err;
			if (user){
				res.status(200).send({id:user._id, email:user.email});
				console.log('var olan kullanıcı');console.log(user._id);
			}
			else {
				var newUser = new User({email : body.email});
				newUser.save(function (err, saved) {
					if (err) throw err;
					res.status(200).send({id:saved._id, email:saved.email});
					// saved
					console.log('yeni kullnıcı kaydı');console.log(saved._id);
				});
			}
		});
	}
	else {
		res.status(200).send({});
	}
});

app.get('/user/:loginId', function (req, res){
	var userList = [];
	User.find({
		_id : {
			$ne : req.params["loginId"]
		}
	}).sort({email : 1}).exec(function(err, data){
		data.forEach(function(v){
			console.log(v._id, v.email);
			userList.push({id: v._id, email:v.email});
		});
		res.status(200).send(userList);
	});
});

app.post('/message/send', function(req, res){
	res.set("Content-Type","application/json;charset=UTF-8");
	var body = req.body || {};
	console.log(req.body);
	if(body.sender && body.receiver && body.message){
		var msg = new Chat(body);
		msg.save(function (err, saved) {
			if (err) throw err;
			res.status(200).send(saved.toObject());

			// saved
			console.log(saved._id);
			console.log("toObject",saved.toObject());

		});

	}
	else {
		res.status(200).send({});
	}
});

app.post('/message', function(req, res){
	res.set("Content-Type","application/json;charset=UTF-8");
	var body = req.body || {};
	if(body.sender && body.receiver){
		Chat.find({
			$or: [
				{ $and: [{sender: body.sender}, {receiver: body.receiver}] },
				{ $and: [{sender: body.receiver}, {receiver: body.sender}] }
			]
		}).exec(function(err, messages){
			console.log(messages);
			if (err) throw err;
			res.status(200).send(messages);
			console.log('daha önceki mesajlar...');
			console.log(messages);
		});

	}
	else {
		res.status(200).send({});
	}
});

io.sockets.on("connection", function (socket) {
	socket.on("message:send", function (data) {
		var msg = new Chat(data);
		msg.save(function (err, saved) {
			if (err) throw err;
			console.log("toObject",saved.toObject());
			io.sockets.emit("message:publish", data);
		});

	});
});
/*
var user = new User({
	email : 'serdbasy@gmail.com'
});
user.save(function (err, saved) {
	if (err) throw err;

	// saved
	console.log(saved._id);
	console.log("toObject",saved.toObject());

});


var Book = mongoose.model("Book", bookSchema);

var book = new Book({
	name: "Java Mimarisiyle Kurumsal Çözümler",
	author: "Rahman Usta",
	price: 25.5
});

Book.find({}, function (err, books) {
	if (err) throw err;
	if (books)
		var bookList = books.map(function (b) {

			return b.toObject();
		});

	console.log(bookList);
});
*/

server.listen(8080, '0.0.0.0');