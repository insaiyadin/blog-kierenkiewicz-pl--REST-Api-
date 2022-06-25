const path = require('path')

const express = require('express');
const PORT = 8080
const bodyParser = require('body-parser')
const multer = require('multer')

const feedRoutes = require('./routes/feed')
const authRoutes = require('./routes/auth')

const app = express();

const {
    v4: uuidv4
} = require('uuid');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        const extension = file.mimetype.split('/')[1]
        cb(null, `${uuidv4()}.${extension}`)
    }
})

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.use(bodyParser.json()); // application/json
// fileStorage
app.use(
    multer({
        storage: fileStorage,
        fileFilter: fileFilter
    }).single('image')
);

app.use('/images', express.static(path.join(__dirname, 'images')));

// cors
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use('/feed', feedRoutes)
app.use('/auth', authRoutes)

app.use((error, req, res, next) => {
    let status = error.statusCode;
    if (!status) {
       status = 500; 
    }
    const message = error.message;
    const data = error.data;
    res.status(status).json({
        message: message,
        data: data
    })
})

const server = app.listen(PORT, console.log(`Listening on http://localhost:${PORT}`));
const io = require('./socket').init(server)
io.on('connection', socket => {
    console.log('Client connected');
})