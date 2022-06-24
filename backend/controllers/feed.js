const {
    validationResult
} = require('express-validator')

const {
    PrismaClient
} = require('@prisma/client')
const prisma = new PrismaClient()

exports.getPosts = async (req, res, next) => {
    const posts = await prisma.post.findMany({
        include: {
            creator: true
        }
    })

    res.status(200).json({
        posts: posts
    })
}

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Podano niepoprawne dane')
        error.statusCode = 422
        throw error;
        // return res.status(422).json({
        //     message: 'Podano niepoprawne dane',
        //     errors: errors.array()
        // })
    }

    if (!req.file) {
        const error = new Error('Brak zdjęcia');
        error.statusCode = 422;
        throw error;
    }

    // const imageUrl = req.file.path;
    const imageUrl = req.file.path.replace("\\" ,"/");
    console.log(imageUrl);
    const {
        title,
        content
    } = req.body;

    try {
        const newPost = await prisma.post.create({
            data: {
                title: title,
                content: content,
                imageUrl: imageUrl,
                userId: 4
            },
            include: {
                creator: true
            }
        })
        res.status(201).json({
            message: "Utworzono post!",
            post: newPost
        })

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getPost = async (req, res, next) => {
    const { postId } = req.params
    const post = await prisma.post.findUnique({
        where: {
            id: +postId
        },
        include: {
            creator: true
        }
    })

    if (!post) {
        const error = new Error('Taki post nie istnieje');
        error.statusCode = 404;
        return next(error)
    }

    res.status(200).json({
        message: 'OK',
        post: post
    })
}