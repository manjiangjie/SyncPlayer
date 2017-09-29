import 'source-map-support/register';

import express from 'express';
import http from 'http';
import socketIo from 'socket.io';
import chalk from 'chalk';
import {ObservableSocket} from "../shared/observable-socket";
import {Observable} from "rxjs";

//Setup
const isDevelopment = process.env.NODE_ENV !== "production";
const app = express();
const server = new http.Server(app);
const io = socketIo(server);

// Client webpack
if (process.env.USE_WEBPACK === "true") {
	var webpackMiddleware = require('webpack-dev-middleware');
	var webpackHotMiddleware = require('webpack-hot-middleware');
	var webpack = require('webpack');
	var clientConfig = require("../../webpack.client")(true);

	const compiler = webpack(clientConfig);
	app.use(webpackMiddleware(compiler, {
		publicPath: '/build/',
		stats: {
			colors: true,
			chunks: false,
			assets: false,
			timings: false,
			modules: false,
			hash: false,
			version: false
		}
	}));
	app.use(webpackHotMiddleware(compiler));
	console.log(chalk.bgYellow('Using Webpack Dev Middleware. This is for DEV only!'));
}

// Configure express
app.set('view engine', 'jade');
app.use(express.static('public'));

const useExternalStyles = !isDevelopment;
app.get('/', (req, res) => {
	res.render('index', {
		useExternalStyles
	});
});

// Modules

// Socket
io.on('connection', socket => {
	console.log(`Got connection from ${socket.request.connection.remoteAddress}`);

	const client = new ObservableSocket();
	client.onAction("login", creds => {
		return Observable.of(`User ${creds.username}`).delay(3000);
	});
});

// Startup
const port = process.env.PORT || 3000;
function startServer() {
	server.listen(port, () => {
		console.log(`Starting http server on ${port}`);
	});
}

startServer();