const path = require('path')

const express = require('express');
const PORT = 8080
const bodyParser = require('body-parser')
const multer = require('multer')

const feedRoutes = require('./routes/feed')

const app = express();

const { v4: uuidv4 } = require('uuid');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4())
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
    multer({storage: fileStorage, fileFilter: fileFilter}).single('image')
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

app.use((error, req, res, next) => {
    const status = error.statusCode
    const message = error.message
    res.status(status).json({
        message: message
    })
})

app.listen(PORT, console.log(`Listening on http://localhost:${PORT}`))