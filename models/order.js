const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    totalPrice: { type: Number, required: true },
    productsOrdered: { type: Array, required: true },
    customerName: { type: String, required: true },
    customerId: { type: String, required: true },
    customerPhoneNumber: { type: Number, required: true },
    customerEmail: { type: String, required: true },
    sellers: { type: Array, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);