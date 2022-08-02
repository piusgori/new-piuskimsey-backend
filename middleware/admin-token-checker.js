const HttpError = require('../models/http-error');
const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');

const adminTokenChecker = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if(!token){
            throw new Error('Token is invalid');
        }
        const decodedToken = jwt.verify(token, 'piuskimsey_secret');
        const adminId = decodedToken.id.trim();
        const foundAdmin = await Admin.findById(adminId);
        if(!foundAdmin){
            throw new Error('Admin does not exist');
        }
        next();
    } catch (err) {
        return next(new HttpError('Token is invalid', null, 403))
    }
}

module.exports = adminTokenChecker;