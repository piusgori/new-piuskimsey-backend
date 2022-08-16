const joke = require('one-liner-joke');
const axios = require('axios');
const HttpError = require('../models/http-error');
// const keys = require('../private-keys')

exports.home = (req, res, next) => {
    const gottenJoke = joke.getRandomJoke();
    res.json({ message: 'Welcome to PiusKimsey', joke: gottenJoke.body })
}

exports.tinyPesa = async (req, res, next) => {
    try {
        const data = { amount: 1, msisdn: 254799978203 };
        const config = { headers: { Apikey: process.env.tinypesaKey } }
        const response = await axios.post('https://tinypesa.com/api/v1/express/initialize', data, config);
    } catch (err) {
        return next(new HttpError('Something has happened'));
    }
    res.status(200).json({ message: 'Pesa' });
}

exports.pesaData = async (req, res, next) => {
    console.log(req);
}