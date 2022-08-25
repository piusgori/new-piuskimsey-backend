const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');

const HttpError = require('./models/http-error');
const Admin = require('./models/admin');
const Product = require('./models/product');
const User = require('./models/user');
const mainRoute = require('./routes/main-route');
const shopRoute = require('./routes/shop-route');
const authRoute = require('./routes/auth-route');
// const privateKeys = require('./private-keys');

const app = express();

const transporter = nodemailer.createTransport(sendgrid({ auth: { api_key: process.env.sendgridKey } }));
const mongoUrl = `mongodb+srv://pius_gori:${process.env.mongoPassword}@piuscluster.wvoqx.mongodb.net/piuskimsey?retryWrites=true&w=majority`

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use(mainRoute);
app.use('/shop', shopRoute);
app.use('/auth', authRoute);

app.use((req, res, next) => {
    throw new HttpError('The page you are looking for could not be found', null, 404);
  })
  
app.use((error, req, res, next) => {
    res.status(error.code || 500);
    res.json({ message: error.message || 'An Unknown error has occurred!', content: error.content || null })
})

schedule.scheduleJob('admin-notification', '0 0 * * *', async () => {
    let foundAdmins;
    try {
        foundAdmins = await Admin.find();
        if(foundAdmins.length > 0){
            for (const a of foundAdmins) {
                const now = new Date().getTime();
                const personExpiry = new Date(a.subscription).getTime();
                const lessTwoDays = (personExpiry - (1000 * 60 * 60 * 24 * 2));
                if (now >= lessTwoDays && now <= personExpiry) {
                    transporter.sendMail({
                        to: a.email,
                        from: 'joskimseyagency@gmail.com',
                        subject: 'Subscription Expiry',
                        html: `
                        <h1>Your Subscription expires soon.</h1>
                        <p>We are notifying you about your subscription expiration.</p>
                        <p>Please note that once your subscription expires you will not be able to add new products, edit your products or sell them. Please update soon for you not to miss the chance.</p>
                        `
                    });
                }
            }
        }
    } catch (err) {
        schedule.cancelJob('admin-notification');
    }
})

schedule.scheduleJob('user-notify', '0 0 * * TUE', async () => {
    let foundProducts;
    let foundUsers;
    let latestProducts = [];
    try {
        foundProducts = await Product.find();
        foundUsers = await User.find();
        if (foundUsers.length > 0 && foundProducts.length > 0){
            const now = new Date().getTime();
            const sevenDaysAgo = (now - (1000 * 60 * 60 * 24 * 7));
            for(const b of foundProducts) {
                const creationDate = new Date(b.createdAt).getTime();
                if(creationDate >= sevenDaysAgo){
                    latestProducts.push({ title: b.title, price: b.price, newPrice: b.newPrice, isDiscount: b.isDiscount, creator: b.creator });
                }
            }
            if(latestProducts.length > 0){
                let message = ``;
                for(const c of latestProducts){
                    message += `<p>${c.creator} added ${c.title} and is selling at KSH${c.price} ${c.isDiscount ? ` with a discount of KSH${c.newPrice}` : '.'}</p><br>`;
                }
                for(const d of foundUsers) {
                    transporter.sendMail({
                        to: d.email,
                        from: 'joskimseyagency@gmail.com',
                        subject: 'Weekly Updates',
                        html: `
                        <h1>Hello Buddy.</h1>
                        ${message}
                        `
                    }); 
                }
            }
        }
    } catch (err) {
        schedule.cancelJob('user-notify');
    }
})

mongoose.connect(mongoUrl).then(() => {
    app.listen(process.env.PORT || 8000);
    console.log('Server started');
}
).catch(err => {
    console.log(err)
})