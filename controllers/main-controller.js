const joke = require('one-liner-joke');

exports.home = (req, res, next) => {
    const gottenJoke = joke.getRandomJoke();
    res.json({ message: 'Welcome to PiusKimsey', joke: gottenJoke.body })
}