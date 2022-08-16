const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const HttpError = require('./models/http-error');
const mainRoute = require('./routes/main-route');
const shopRoute = require('./routes/shop-route');
const authRoute = require('./routes/auth-route');
// const privateKeys = require('./private-keys');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
});

const mongoUrl = `mongodb+srv://pius_gori:${process.env.mongoPassword}@piuscluster.wvoqx.mongodb.net/piuskimsey?retryWrites=true&w=majority`

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use(mainRoute);
app.use('/shop', shopRoute);
app.use('/auth', authRoute);

app.use((req, res, next) => {
    throw new HttpError('The page you are looking for could not be found', null, 404);
  })
  
app.use((error, req, res, next) => {
    res.status(error.code || 500);
    res.json({ message: error.message || 'An Unknown error has occurred!', content: error.content || null })
})

io.on('connection', (socket) => {
    socket.on("send_message", (data) => {
        socket.broadcast.emit("receive_message", data);
    })
})

mongoose.connect(mongoUrl).then(() => {
    server.listen(process.env.PORT || 8000);
    console.log('Server started');
}
).catch(err => {
    console.log(err)
})