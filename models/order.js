const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    totalPrice: { type: Number, required: true },
    productsOrdered: { type: Array, required: true },
    customerName: { type: String, required: true },
    customerId: { type: String, required: true },
    customerPhoneNumber: { type: Number, required: true },
    customerEmail: { type: String, required: true },
    customerLocation: { type: Object, required: true },
    sellerName: { type: String, required: true },
    sellerId: { type: String, required: true },
    sellerPhoneNumber: { type: String, required: true },
    sellerEmail: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);