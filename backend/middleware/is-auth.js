const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const header = req.get('Authorization');
    if (!header) {
        const authErr = new Error('Autoryzacja nie powiodła się.');
        authErr.statusCode = 401;
        return next(authErr);
    }
    const token = header.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'secret');;
    } catch (err) {
        console.log(err);
        err.statusCode = 500;
        return next(err);
    }
    if (!decodedToken) {
        const error = new Error('Autoryzacja nie powiodła się');
        error.statusCode = 401;
        return next(error);
    };
    req.userId = decodedToken.userId;
    next();
};