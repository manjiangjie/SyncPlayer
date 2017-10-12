import 'source-map-support/register';
import express from 'express';
import http from 'http';
import socketIo from 'socket.io';
import chalk from 'chalk';
import "shared/operators";
import {ObservableSocket} from "../shared/observable-socket";
import {Observable} from "rxjs";
import {UsersModule} from "./modules/users";
import {ChatModule} from "./modules/chat";
import {PlaylistModule} from "./modules/playlist";
import {FileRepository} from "./repositories/file";

// Initialization
const isDevelopment = process.env.NODE_ENV !== "production";
const app = express();
const server = new http.Server(app);
const io = socketIo(server);

// Config client webpack
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

// Services
const videoServices = [];
const playlistRepository = new FileRepository("./data/playlist.json");

// Modules
const users = new UsersModule(io);
const chat = new ChatModule(io, users);
const playlist = new PlaylistModule(io, users, playlistRepository, videoServices);
const modules = [users, chat, playlist];

// Socket
io.on("connection", socket => {
	console.log(`Got connection from ${socket.request.connection.remoteAddress}`);

	const client = new ObservableSocket(socket);
	for (let mod of modules) {
		mod.registerClient(client);
	}
	for (let mod of modules) {
		mod.clientRegistered(client);
	}
});

// Startup
const port = process.env.PORT || 3000;

Observable.merge(...modules.map(m => m.init$())).subscribe({
	complete() {
		server.listen(port, () => {
			console.log(`Starting http server on ${port}`);
		});
	},
	error(error) {
		console.error(`Could not init module: ${error.stack || error}`);
	}
});
