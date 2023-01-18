const joke = require('one-liner-joke');

exports.home = (req, res, next) => {
    const gottenJoke = joke.getRandomJoke();
    res.json({ message: 'Welcome to PiusKimsey', joke: gottenJoke.body })
}

exports.results = (req, res, next) => {
    console.log('before');
    console.log(req.body.Body.stkCallback.CallbackMetadata);
    console.log('after');
    res.json({ message: 'Success' });
}