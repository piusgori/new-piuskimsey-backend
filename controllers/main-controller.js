const joke = require('one-liner-joke');

exports.home = (req, res, next) => {
    const gottenJoke = joke.getRandomJoke();
    res.json({ message: 'Welcome to PiusKimsey', joke: gottenJoke.body })
}

exports.results = (req, res, next) => {
    console.log(req);
    res.json({ message: 'Success' });
}