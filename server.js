const express = require("express"),
path = require("path"),
app = express(),
port = 8000;

app.use(express.static(path.join(__dirname, "./static")));
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");

app.get("/", (req,res) => { res.render("index") })

const server = app.listen(port, () => { console.log("listening on port 8000") });
const io = require("socket.io").listen(server);

var users = [], msgs = [];

io.sockets.on("connection", socket => {
	
	socket.on("got_new_user", name => {
		users.push({username:name.name, id:socket.id});
		socket.broadcast.emit("new_user", {new_user_name:name.name});
		const username = users.find(u => u.id === socket.id).username;
		socket.emit("welcome", { username, id: socket.id, msgs });
		io.emit("update_users_everywhere", users);
	});

	socket.on("got_new_msg", (msg, userId) => {
		const username = users.find(u => u.id === userId).username;
		msgs.push({username, msg:msg.msg})
		io.emit("new_msg", { msg: msg.msg }, users, userId);
	})

	socket.on("disconnect", () => {
		var newUsers = users;
		const i = newUsers.findIndex(u => u.id === socket.id);
		if (i !== -1) {
			const goodbyeUser = newUsers[i].username;
			newUsers.splice(i, 1);
			io.emit("disconnected_user", goodbyeUser, newUsers);
		}
	})

})

// debugging tool
// setInterval(function() {
// 	console.log('line 59 users:', users)
// 	console.log('line 60 msgs:', msgs)
// 	if(!users) {
// 		console.log('line 47, no users no msg', msgs)
// 		msgs = [];
// 		console.log('line 50, no users no msg', msgs)
// 	}
// }, 1000)