const {
    validationResult
} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const {
    PrismaClient
} = require('@prisma/client')
const prisma = new PrismaClient()

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Podano niepoprawne dane');
        error.statusCode = 422;
        error.data = errors.array();
        return next(error);
    }
    const {
        email,
        name,
        password
    } = req.body;

    const bcPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: {
            email: email,
            name: name,
            password: bcPassword
        }
    })

    res.status(201).json({
        message: 'Utworzono nowego użytkownika.',
        userId: user.id
    })
}

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    })

    let foundUser;

    if (!user) {
        const error = new Error('Taki użytkownik nie istnieje');
        error.statusCode = 401
        return next(error);
    }

    foundUser = user;

    const comparePassword = await bcrypt.compare(password, foundUser.password)

    if (!comparePassword) {
        const error = new Error('Podano błędne hasło');
        error.statusCode = 401
        return next(error);
    }

    const token = jwt.sign({
        email: foundUser.email,
        userId: foundUser.id.toString()
    }, 
    'secret', 
    {expiresIn: '1h'});

    res.status(200).json({
        message: 'Zalogowano',
        token: token,
        userId: foundUser.id.toString()
    })
}

exports.getUserStatus = async (req, res, next) => {
    const user = await prisma.user.findUnique({
        where: {
            id: +req.userId
        }
    })
    
    if (!user) {
        const error = new Error('Nie znaleziono użytkownika')
        error.statusCode = 404;
        return next(error);
    }
    res.status(200).json({
        status: user.status
    })
}

exports.updateUserStatus = async (req, res, next) => {
    const { status } = req.body;
    console.log(status);
    const user = await prisma.user.findUnique({
        where: {
            id: +req.userId
        }
    })

    if (!user) {
        const error = new Error('Nie znaleziono użytkownika')
        error.statusCode = 404;
        return next(error);
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: +req.userId
        },
        data: {
            status: status
        }
    })

    console.log(updatedUser);
    res.status(200).json({
        status: updatedUser.status
    })
}