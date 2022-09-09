const Admin = require('../models/admin');
const User = require('../models/user');
const Region = require('../models/region');
const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const Order = require('../models/order');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
// const privateKeys = require('../private-keys');

const transporter = nodemailer.createTransport(sendgrid({ auth: { api_key: process.env.sendgridKey } }));
const tinypesaKey = process.env.tinypesaKey;

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
            foundAdmins.push({ id: b._id, name: b.name, email: b.email, phoneNumber: b.phoneNumber, products: b.products, createdAt: b.createdAt, subscription: b.subscription });
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

exports.signup = async (req, res, next) => {
    const { name, email, password, phoneNumber, region } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for (const d of errorArray){
            messageArray.push({ message: d.msg, type: d.param });
        }
        return next(new HttpError('Unable to Proceed', messageArray, 422))
    }

    try {
        const foundUser = await User.findOne({ email: email });
        const foundAdmin = await Admin.findOne({ email: email });
        if(foundUser || foundAdmin){
            const message = 'The E-Mail address you have submitted already exists. Please try another one';
            const type = 'email';
            return next(new HttpError('Unable to process email', [{ message, type }], 422))
        }
    } catch (err) {
        return next(new HttpError('Failed to get users'))
    }

    try {
        const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
        const passwordResult = password.match(passwordPattern);
        if(!passwordResult){
            const message = 'Please enter a strong password of at least 8 characters containing a character, number and symbol';
            const type = 'password';
            return next(new HttpError('Unable to process password', [{ message, type }], 422));
        }
    } catch (err) {
        return next(new HttpError('Unable to validate password input'))
    }

    let hashedPassword;
    
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch(err) {
        return next(new HttpError('Unable to hash the password'));
    }

    const formattedNumber = () => {
        const number = Number(phoneNumber);
        const newNumber = Number('254' + number);
        return newNumber;
    }

    const newUser = new User({ name, email, password: hashedPassword, phoneNumber: formattedNumber(), region, cart: [], orders: [] });

    try {
        await newUser.save();
    } catch (err) {
        return next(new HttpError('Unable to save newly created user'));
    }
    let token;

    try {
        token = jwt.sign({ id: newUser._id, email: newUser.email, isAdmin: false }, 'piuskimsey_secret', { expiresIn: '1h' });
    } catch (err) {
        return next(new HttpError('Unable generating token'))
    }
    res.status(201).json({ message: 'Signed up successfully', id: newUser._id, name: newUser.name, email: newUser.email, phoneNumber: newUser.phoneNumber, region: newUser.region, cart: newUser.cart, orders: newUser.orders, token: token, isAdmin: false });
}

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for (const d of errorArray){
            messageArray.push({ message: d.msg, type: d.param });
        }
        return next(new HttpError('Unable to Proceed', messageArray, 422))
    }
    let foundUser;
    let foundAdmin;
    try {
        foundUser = await User.findOne({ email: email });
        if(!foundUser){
            foundAdmin = await Admin.findOne({ email: email });
            if(!foundAdmin && !foundUser){
                const message = 'We have not found this E-Mail address. Perhaps create an account with us.'
                const type = 'email';
                return next(new HttpError('Unable to process email', [{ message, type }], 403))
            }
        }
    } catch (errr) {
        return next(new HttpError('Unable to find user or admin'));
    }

    try {
        const passwordIsValid = await bcrypt.compare(password, foundUser ? foundUser.password : foundAdmin.password);
        if(!passwordIsValid){
            const message = 'You have entered the wrong password. Please try again!';
            const type = 'password';
            return next(new HttpError('Unable to process password', [{ message, type }], 403));
        }
    } catch (err) {
        console.log(err);
        return next(new HttpError('Unable to proceed from password comparison'));
    }
    
    let foundOrders;

    try {
        foundOrders = await Order.find({ customerId: foundUser ? foundUser._id : foundAdmin._id });
    } catch (err) {
        return next(new HttpError('Unable to get orders'));
    }

    let token;
    
    try {
        token = jwt.sign({
            id: foundUser ? foundUser._id : foundAdmin._id,
            email: foundUser ? foundUser.email : foundAdmin.email,
            isAdmin: foundUser ? false : true
        }, 'piuskimsey_secret', { expiresIn: '1h'})
    } catch (err) {
        return next(new HttpError('Unable to generate token'));
    }

    const responseBody = {
        id: foundUser ? foundUser._id : foundAdmin._id,
        name: foundUser ? foundUser.name : foundAdmin.name,
        email: foundUser ? foundUser.email : foundAdmin.email,
        phoneNumber: foundUser ? foundUser.phoneNumber: foundAdmin.phoneNumber,
        region: foundUser ? foundUser.region : foundAdmin.region,
        cart: foundUser ? foundUser.cart : foundAdmin.cart,
        products: foundUser ? null : foundAdmin.products,
        orders: foundOrders,
        token: token,
        isAdmin: foundUser ? false : true,
        subscription: foundUser ? null : foundAdmin.subscription 
    }
    res.status(200).json({ message: 'Logged in Successfully', ...responseBody })
}

exports.upgradeToAdmin = async (req, res, next) => {
    const userId = req.params.userId.trim();
    let foundUser;
    let newAdmin;
    const subSubtracted = (new Date().getTime()) - (1000 * 60);
    const now = new Date(subSubtracted).toISOString();
    // const now = new Date().toISOString();
    try {
        foundUser = await User.findById(userId);
        if(!foundUser){
            const message = "We are sorry but it seems you haven't created a profile with us";
            const type = 'Not Found';
            return next(new HttpError('Unable to process user', [{ message,  type }], 404))
        }
        newAdmin = new Admin({ name: foundUser.name, email: foundUser.email, password: foundUser.password, phoneNumber: foundUser.phoneNumber, region: foundUser.region, cart: foundUser.cart, orders: foundUser.orders, products: [], subscription: now });
    } catch (err) {
        return next(new HttpError('Unable to look for the user'));
    }

    try {
        await newAdmin.save();
    } catch (err) {
        return next(new HttpError('Unable to save new admin'))
    }

    try {
        await User.findByIdAndDelete(userId);
    } catch (err) {
        return next(new HttpError('Unable to delete upgraded user'))
    }

    let token;

    try {
        token = jwt.sign({ id: newAdmin._id, email: newAdmin.email, isAdmin: true }, 'piuskimsey_secret', { expiresIn: '1h' });
    } catch (err) {
        return next(new HttpError('Unable to generate new token'))
    }

    const responseBody = {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        phoneNumber: newAdmin.phoneNumber,
        region: newAdmin.region,
        cart: newAdmin.cart,
        products: newAdmin.products,
        orders: newAdmin.orders,
        token: token,
        subscription: now,
        isAdmin: true
    }
    res.status(201).json({ message: 'User Upgraded successfully', ...responseBody })
}

exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for (const f of errorArray){
            messageArray.push({ message: f.msg, type: f.param });
        }
        return next(new HttpError('Unable to process', messageArray, 422));
    }
    let existingUser;
    let existingAdmin;
    try {
        existingUser = await User.findOne({ email });
        if(!existingUser){
            existingAdmin = await Admin.findOne({ email });
            if(!existingAdmin && !existingUser){
                const message = 'We have not found this E-Mail address.';
                const type = 'email';
                return next(new HttpError('Unable to process email', [{ message, type }], 403));
            }
        }
    } catch (err) {
        return next(new HttpError('Unable to look for the user or admin'));
    }

    const generateNewNumber = () => {
        let resetNumber = Math.round(Math.random() * 1000000);
        if(resetNumber.toString().length < 6){
            for(i = 1; i <= 6 - resetNumber.toString().length; i++){
                resetNumber = resetNumber.toString() + Math.round(Math.random() * 1).toString();
            }
        }
        return Number(resetNumber);
    }

    const theGeneratedNumber = generateNewNumber();

    let passwordResetToken;

    try {
        passwordResetToken = jwt.sign({
            id: existingUser ? existingUser._id : existingAdmin._id,
            email: existingUser ? existingUser.email : existingAdmin.email,
            code: theGeneratedNumber,
            isAdmin: existingUser ? false : true
         }, 'piuskimsey_secret', { expiresIn: '1h' })
    } catch (err) {
        return next(new HttpError('Unable to generate password reset token'))
    }

    transporter.sendMail({
        to: email,
        from: 'joskimseyagency@gmail.com',
        subject: 'Reset Password',
        html: `
        <h1>Here is your link</h1>
        <p>Please select this <div style="height: fit-content; width: fit-content; background-color: #e98d15; padding: 10px 24px; border-radius: 15px; cursor: pointer;"><a style="text-decoration: none; color: white;" href="https://piuskimsey.xyz/password-reset/${passwordResetToken}">Link</a></div> to set up your new password</p>
        `
    });
    res.status(200).json({ message: 'E-Mail sent successfully', email, id: existingUser ? existingUser._id : existingAdmin._id })
}

exports.setNewPassword = async (req, res, next) => {
    const { password } = req.body;
    const id = req.params.id.trim();
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for (const g of errorArray){
            messageArray.push({ message: g.msg, type: g.param })
        }
        return next(new HttpError('Unable to process', messageArray, 422))
    }
    let existingUser;
    let existingAdmin;

    try {
        existingUser = await User.findById(id);
        if(!existingUser){
            existingAdmin = await Admin.findById(id);
            if(!existingAdmin && !existingUser){
                const message = 'We have not found you. Perhaps create an account with us.';
                const type = 'user';
                return next(new HttpError('Unable to process user', [{ message, type }], 403));
            }
        }
    } catch (err) {
        return next(new HttpError('Unable to look for user or admin'))
    }

    try {
        const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
        const passwordResult = password.match(passwordPattern);
        if(!passwordResult){
            const message = 'Please enter a strong password of at least 8 characters containing a character, number and symbol';
            const type = 'password';
            return next(new HttpError('Unable to process password', [{ message, type }], 422));
        }
    } catch (err) {
        return next(new HttpError('Unable to validate password'));
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(new HttpError('Unable to hash the password'));
    }

    if (existingUser && !existingAdmin){
        existingUser.password = hashedPassword
    } else if(!existingUser && existingAdmin){
        existingAdmin.password = hashedPassword
    }

    try {
        if(existingUser && !existingAdmin){
            await existingUser.save();
        } else if (!existingUser && existingAdmin){
            await existingAdmin.save();
        }
    } catch (err) {
        return next(new HttpError('Unable to save the user or admin'))
    }
    res.status(200).json({ message: 'Password Updated successfully' })
}

exports.requestRegionAdd = (req, res, next) => {
    const { region } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for (const g of errorArray){
            messageArray.push({ message: g.msg, type: g.param })
        }
        return next(new HttpError('Unable to process', messageArray, 422))
    }
    transporter.sendMail({
        to: 'piusgori@gmail.com',
        from: 'joskimseyagency@gmail.com',
        subject: 'Request Region Addition',
        html: `
        <h1>A request for you to add a region</h1>
        <p>A new request has been made for you to add the ${region} region for selection</p>
        `
    });
    res.status(200).json({ message: 'Region request has been sent successfully' })
}

exports.requestCategoryAdd = (req, res, next) => {
    const { category, email } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for (const g of errorArray){
            messageArray.push({ message: g.msg, type: g.param })
        }
        return next(new HttpError('Unable to process', messageArray, 422))
    }
    transporter.sendMail({
        to: 'piusgori@gmail.com',
        from: 'joskimseyagency@gmail.com',
        subject: 'Request Category Addition',
        html: `
        <h1>A request for you to add a category</h1>
        <p>${email} is requesting you to add the ${category} category for selection</p>
        `
    });
    res.status(200).json({ message: 'Category request has been sent successfully' })
}

exports.upgradeAdmin = async (req, res, next) => {
    const adminId = req.params.adminId.trim();
    let foundAdmin;
    try {
        foundAdmin = await Admin.findById(adminId);
        if(!foundAdmin){
            return next(new HttpError('No admin found', [{ message: 'Admin not found', type: 'admin' }], 404));
        }

    } catch (err) {
        return next(new HttpError('Unable to get the admin'));
    }

    try {
        const data = { amount: 100, msisdn: Number(foundAdmin.phoneNumber) };
        const config = { headers: { Apikey: tinypesaKey } }
        const response = await axios.post('https://tinypesa.com/api/v1/express/initialize', data, config);
    } catch (err) {
        return next(new HttpError('Unable to push MPesa SDK'));
    }

    res.status(200).json({ message: 'Successfully sent SDK to admin' });
}

exports.checkTransaction = async (req, res, next) => {
    const { Msisdn, Amount, ResultDesc, ResultCode } = req.body.Body.stkCallback;
    if(ResultCode !== 0 || ResultDesc !== 'The service request is processed successfully.'){
        return next(new HttpError('Unable to process payment', [{ message: ResultDesc, type: 'payment' }], 403));
    }
    const now = new Date().getTime();
    const thirtyDays = now + (1000 * 60 * 60 * 24 * 30);
    // const thirtyDays = now + (1000 * 60 * 3);
    const thirtyDaysDate = new Date(thirtyDays).toISOString();
    let foundAdmin;
    try {
        foundAdmin = await Admin.findOneAndUpdate({ phoneNumber: Msisdn }, { subscription: thirtyDaysDate });
    } catch (err) {
        return next(new HttpError('Unable to update admin'));
    }
    res.status(200).json({ message: 'Subscription updated successfully', subscription: thirtyDaysDate })
}