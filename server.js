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
		// set user's session id to his/her socket id
		var sessionID = socket.id
		// add new user to users array
		users.push([name.name, sessionID]);
		// new user comes in, alert everyone (other than new user)
		socket.broadcast.emit("new_user", {new_user_name:name.name});
		// send welcome msg back to new user
		socket.emit("welcome", users, sessionID, msgs);
		// update all clients with new list of users in chatroom
		io.emit("update_users_everywhere", users);
	});
	// add new msg to msgs array
	socket.on("got_new_msg", function(msg, user_id){
		console.log(user_id)
		for(var i = 0; i < users.length; i++) {
			if(users[i][1] == user_id) { var username = users[i][0]; }
		}
		msgs.push([username, msg.msg])
		// send the new message to everyone
		io.emit("new_msg", {msg:msg.msg}, users, user_id);
	})
	// receive notice of user leaving chatroom
	socket.on("disconnect", function(){
		for(var i = 0; i < users.length; i++) {
			if(users[i][1] == socket.id) {
				var goodbye_user = users[i][0];
				users.splice(i, 1);
			}
		}
		// update all remaining users with notice that someone left
		io.emit("disconnected_user", goodbye_user, users);
	})
})

// debugging tool & monitor that msgs are up to date if users array is empty
setInterval(function() {
	console.log(users, ' line 59 users')
	console.log(msgs, ' line 60 msgs')
	if(!users[0]) {
		console.log('line 47, no users no msg', msgs)
		msgs = [];
		console.log('line 50, no users no msg', msgs)
	}
}, 1000)