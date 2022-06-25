const fs = require('fs')
const path = require('path')

const {
    validationResult
} = require('express-validator')

const {
    PrismaClient
} = require('@prisma/client')
const prisma = new PrismaClient()

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;

    let totalItems = await prisma.post.count()

    const posts = await prisma.post.findMany({
        include: {
            creator: true
        },
        take: perPage,
        skip: (currentPage - 1) * perPage
    })

    res.status(200).json({
        posts: posts,
        totalItems: totalItems,
    })
}

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Podano niepoprawne dane')
        error.statusCode = 422
        return next(error);
    }

    if (!req.file) {
        const error = new Error('Brak zdjęcia');
        error.statusCode = 422;
        return next(error);
    }

    const imageUrl = req.file.path.replace("\\", "/");
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
                userId: +req.userId
            },
            include: {
                creator: true
            }
        })
        res.status(201).json({
            message: "Utworzono post!",
            post: newPost
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getPost = async (req, res, next) => {
    const {
        postId
    } = req.params
    const post = await prisma.post.findUnique({
        where: {
            id: +postId
        },
        include: {
            creator: true
        }
    });

    if (!post) {
        const error = new Error('Taki post nie istnieje');
        error.statusCode = 404;
        return next(error);
    }

    res.status(200).json({
        message: 'OK',
        post: post
    });
}

exports.updatePost = async (req, res, next) => {
    // found error with adding image
    const {
        postId
    } = req.params;

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Podano niepoprawne dane')
        error.statusCode = 422
        return next(error);
    }

    const {
        title,
        content
    } = req.body
    let imageUrl = req.body.image
    if (req.file) {
        imageUrl = req.file.path.replace("\\", "/");
    }
    if (!imageUrl) {
        const error = new Error('Brak zdjęcia');
        error.statusCode = 422;
        return next(error);
    }
    try {
        const getBeforeChanges = await prisma.post.findUnique({
            where: {
                id: +postId
            }
        })
    
        if (getBeforeChanges.userId.toString() !== req.userId) {
            if (req.file) {
                clearImage(req.file.path.replace("\\", "/"));
            }

            const userError = new Error('Nie jesteś autorem postu');
            userError.statusCode = 403;
            return next(userError);
        }

        if (req.file) {
            clearImage(getBeforeChanges.imageUrl);
        }

        const post = await prisma.post.update({
            where: {
                id: +postId
            },
            data: {
                title: title,
                content: content,
                imageUrl: imageUrl
            },
            include: {
                creator: true
            }
        })
        return res.status(200).json({
            message: 'Post zaktualizowany',
            post: post
        })
    } catch (err) {
        console.log(err);
        return next(err)
    }
}

exports.deletePost = async (req, res, next) => {
    const {
        postId
    } = req.params;
    const post = await prisma.post.findUnique({
        where: {
            id: +postId
        }
    })

    if (post.userId.toString() !== req.userId) {
        const userError = new Error('Nie jesteś autorem postu');
        userError.statusCode = 403;
        return next(userError);
    }
    
    if (!post) {
        const error = new Error('Post nie istnieje');
        error.statusCode = 404;
        return next(error);
    }

    const postDelete = await prisma.post.delete({
        where: {
            id: +postId
        }
    })

    clearImage(postDelete.imageUrl)
    res.status(200).json({
        message: 'Post został usunięty'
    })
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err))
}