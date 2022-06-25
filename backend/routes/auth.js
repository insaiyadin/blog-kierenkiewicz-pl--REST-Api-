const express = require('express');
const {
    body
} = require('express-validator');

const {
    PrismaClient
} = require('@prisma/client')
const prisma = new PrismaClient()
const authController = require('../controllers/auth')
const isAuth = require('../middleware/is-auth')

const router = express.Router();

router.put('/signup', [
    body('email')
    .isEmail()
    .withMessage('Wpisz poprawny adres email.')
    // await/async ???
    .custom((value, {
        req
    }) => {
        return prisma.user.findUnique({
            where: {
                email: value
            }
        }).then(user => {
            if (user) {
                return Promise.reject('Ten adres email już istnieje.')
            }
        })
    })
    .normalizeEmail(),
    body('password').trim().isLength({
        min: 5
    }),
    body('name').trim().not().isEmpty()
], authController.signup);

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getUserStatus);

router.patch('/status', isAuth, [
    body('status')
        .trim()
        .not()
        .isEmpty()
], authController.updateUserStatus);

module.exports = router;