const Admin = require('../models/admin');
const User = require('../models/user');
const Region = require('../models/region');
const HttpError = require('../models/http-error');


exports.getUsers = async (req, res, next) => {
    const foundUsers = [];
    try {
        const users = await User.find();
        if(!users){
            return next(new HttpError('Unable to fetch the users'));
        }
        for (const a of users){
            foundUsers.push({ id: a._id, name: a.name, email: a.email, phoneNumber: a.phoneNumber, createdAt: a.createdAt })
        }
    } catch (err) {
        return next(new HttpError('An unexpected error occured'));
    }
    res.status(200).json({ message: 'Found users', users: foundUsers })
}

exports.getAdmins = async (req, res, next) => {
    const foundAdmins = [];
    try {
        const admins = await Admin.find();
        if(!admins){
            return next(new HttpError('Unable to fetch the admins'));
        }
        for (const b of admins){
            foundAdmins.push({ id: b._id, name: b.name, email: b.email, phoneNumber: b.phoneNumber, products: b.products, createdAt: b.createdAt });
        }
    } catch (err) {
        return next(new HttpError('An unexpected error occured'));
    }
    res.status(200).json({ message: 'Found Admins', admins: foundAdmins });
}

exports.getRegions = async (req, res, next) => {
    const foundRegions = [];
    try{
        const regions = await Region.find();
        if(!regions){
            return next(new HttpError('Unable to fetch the regions'));
        }
        for (const c of regions){
            foundRegions.push({ id: c._id, title: c.title });
        }
    } catch (err) {
        return next(new HttpError('An unexpected error occured'))
    }
    res.status(200).json({ message: 'Found the Regions', regions: foundRegions });
}