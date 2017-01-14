var express = require("express");
var path = require("path");
var app = express();

app.use(express.static(path.join(__dirname, "./static")));
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");
app.get("/", function(req,res){
	res.render("index");
})
var users = [], msgs = [];

var server = app.listen(8000, function(){
	console.log("listening on port 8000")
});

var io = require("socket.io").listen(server);
io.sockets.on("connection", function(socket){
	console.log("USING SOCKETS");
	console.log(socket.id);
	socket.on("got_new_user", function(name){
		var sessionID = socket.id
		users.push([name.name, sessionID]);
		socket.broadcast.emit("new_user", {new_user_name:name.name});
		socket.emit("welcome", users, sessionID, msgs);
		io.emit("update_users_everywhere", users);
	});

	socket.on("got_new_msg", function(msg, user_id){
		console.log(user_id)
		for(var i = 0; i < users.length; i++) {
			if(users[i][1] == user_id) { var username = users[i][0]; }
		}
		msgs.push([username, msg.msg])
		io.emit("new_msg", {msg:msg.msg}, users, user_id);
	})

	socket.on("disconnect", function(){
		for(var i = 0; i < users.length; i++) {
			if(users[i][1] == socket.id) {
				var goodbye_user = users[i][0];
				users.splice(i, 1);
			}
		}
		io.emit("disconnected_user", goodbye_user, users);
	})
	if(!users) {
			console.log('line 47, no users no msg', msgs)
			msgs = [];
			io.emit("empty_messages");
			console.log('line 50, no users no msg', msgs)
	}
})

setInterval(function() {
	console.log(users, ' line 59 users')
	console.log(msgs, ' line 60 msgs')
}, 1000)