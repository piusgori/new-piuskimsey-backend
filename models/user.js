const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    region: { type: String, required: true },
    cart: { type: Array, required: true },
    orders: { type: Array, required: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);