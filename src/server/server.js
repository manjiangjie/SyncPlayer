"use strict";

var http = require("http");
var express = require("express");
var socketIo = require("socket.io");

const app = express();
app.set("view engine", "jade");

app.use(express.static("./public"));

app.get("/home", (req, res) => {
	res.render("index", {title: "SyncPlayer"});
});

app.get("/", (req, res) => {
	res.end("Hello world");
});

const server = new http.Server(app);
const io = socketIo(server);

io.on("connection", socket => {
	console.log("Client connected");
	socket.on("chat:add", data => {
		console.log(data);
		io.emit("chat:added", data);
	});
});

const port = 3000;
server.listen(port, () => {
	console.log(`Server started on port ${port}`);
});