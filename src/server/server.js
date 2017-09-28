"use strict";

import "source-map-support/register";
import express from "express";
import socketIo from "socket.io";
import http from "http";

const isDevelopment = process.env.NODE_ENV !== "production";
const useExternalStyles = !isDevelopment;
const app = express();
const server = new http.Server(app);
const io = socketIo(server);

app.set("view engine", "jade");
app.use(express.static("public"));

app.get("/", (req, res) => {
	res.render("index", {
		useExternalStyles
	});
});

app.get("/home", (req, res) => {
	res.render("index", {title: "SyncPlayer"});
});

// Modules

// Socket
io.on("connection", socket => {
	console.log("Client connected");
	socket.on("chat:add", data => {
		console.log(data);
		io.emit("chat:added", data);
	});
});

// Startup
const port = process.env.PORT || 3000;
function startServer() {
	server.listen(port, () => {
		console.log(`Http server started on port ${port}`);
	});
}

startServer();
