const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const router = require('express').Router();

const app = express();

mongoose.connect(process.env.dbUrl || 'mongodb+srv://kaushikmdeo:kaushik123@frontm.zltir.mongodb.net/frontm?retryWrites=true&w=majority', {useNewUrlParser: true});

const PORT = process.env.port || 3000;
const server = require('http').Server(app);

app.use(bodyParser.json());
app.use(router);
app.use((req, res, next) => {
    req.queryStartTime = process.hrtime();
    next();
});
app.use('/api', require('./routes'));
app.get('/', (req, res) => res.send('Welcome to FrontM'));

server.listen(PORT, () => {
    console.log(`server is live on http://localhost:${PORT}`);
});