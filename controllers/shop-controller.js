const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const Product = require('../models/product');
const Category = require('../models/category');
const Admin = require('../models/admin');
const User = require('../models/user');
const Region = require('../models/region');
const Order = require('../models/order');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
// const privateKeys = require('../private-keys');

const transporter = nodemailer.createTransport(sendgrid({ auth: { api_key: process.env.sendgridKey } }));

exports.mail = async (req, res, next) => {
    const { email } = req.body;
    let products;
    try {
        products = await Product.find();
    } catch (err) {
        return next(new HttpError('Unable to fetch users or admins'));
    }
    let message = `<h2>We welcome you on board and would like to show you some of our latest products</h2>`
    if(products.length === 0) {
        message = 'We have not yet added any products to our site! Hold on and enjoy yourself with a joke from the home page';
    } else if (products.length < 10){
        for (const k of products) {
            message+= `<p>${k.title}: KSH ${k.price}</p><br>`;
        }
    } else if (products.length > 10){
        const sortedProducts = products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const firstTen = sortedProducts.filter((prod, index) => index < 10);
        for(const l of firstTen){
            message+= `<p>${l.title}: KSH ${l.price}</p><br>`;
        }
    }
    transporter.sendMail(({
        to: email,
        from: 'joskimseyagency@gmail.com',
        subject: 'We are welcoming you on board',
        html: `<h1>Hello Buddy</h1>
        ${message}`
    }))
    res.status(200).json({ message: 'E-Mail has been sent' })
}

exports.search = async (req, res, next) => {
    const { text } = req.body;
    let products;
    let admins;
    try {
        products = await Product.find();
        admins = await Admin.find();
    } catch (err) {
        return next(new HttpError('Unable to find products or admins'))
    }
    const foundProducts = [];
    const foundAdmins = [];
    const regExp = new RegExp(`${text}`, 'i');
    for (const i of products){
        const isPresent = regExp.test(i.title);
        if(isPresent){
            foundProducts.push({ id: i._id, title: i.title, price: i.price, isDiscount: i.isDiscount, isFinished: i.isFinished, newPrice: i.newPrice, category: i.category, image: i.image, description: i.description, creator: i.creator, creatorSubscription: i.creatorSubscription, region: i.region, creatorDetails: i.creatorDetails, createdAt: i.createdAt });
        }
    }
    for (const b of admins){
        const isPresent = regExp.test(b.name);
        if(isPresent){
            foundAdmins.push({ id: b._id, name: b.name, email: b.email, phoneNumber: b.phoneNumber, products: b.products, createdAt: b.createdAt });
        }
    }
    res.status(200).json({ message: 'Search Results', products: foundProducts, people: foundAdmins })
}

exports.getProducts = async (req, res, next) => {
    let fetchedProducts = [];
    try { 
        const products = await Product.find();
        if(!products){
            return next(new HttpError('We were unable to fetch the products'));
        }
        for (const a of products){
            fetchedProducts.push({ id: a._id, title: a.title, price: a.price, isDiscount: a.isDiscount, isFinished: a.isFinished, newPrice: a.newPrice, category: a.category, image: a.image, description: a.description, creator: a.creator, creatorSubscription: a.creatorSubscription, region: a.region, creatorDetails: a.creatorDetails, createdAt: a.createdAt });
        }
    } catch (err) {
        return next(new HttpError('An unexpected error occurred'));
    };
    res.status(200).json({ message: 'Products found', products: fetchedProducts });
}

exports.getCategories = async (req, res, next) => {
    let fetchedCategories = [];
    try {
        const categories = await Category.find();
        if(!categories){
            return next(new HttpError('We were unable to fetch the categories'));
        }
        for (const b of categories){
            fetchedCategories.push({ id: b._id, title: b.title });
        }
    } catch (err) {
        return next(new HttpError('An unexpected error occurred'));
    }
    res.status(200).json({ message: 'Found categories', categories: fetchedCategories });
}

exports.getProductById = async (req, res, next) => {
    const productId = req.params.productId.trim();
    let foundProduct;
    try {
        foundProduct = await Product.findById(productId);
        if(!foundProduct){
            const message = 'The product was not found';
            const type = 'product';
            return next(new HttpError('The product was not found', [{ message, type }], 404))
        }
    } catch (err) {
        return next(new HttpError('Unable to find product'));
    }
    res.status(200).json({ message: 'Found the product', id: foundProduct._id, title: foundProduct.title, price: foundProduct.price, isDiscount: foundProduct.isDiscount, isFinished: foundProduct.isFinished, newPrice: foundProduct.newPrice, category: foundProduct.category, image: foundProduct.image, description: foundProduct.description, region: foundProduct.region, creator: foundProduct.creator, creatorSubscription: foundProduct.creatorSubscription, creatorDetails: foundProduct.creatorDetails, createdAt: foundProduct.createdAt })
}

exports.getProductsByAdminId = async (req, res, next) => {
    const adminId = req.params.adminId.trim();

    let foundAdmin;

    try {
        foundAdmin = await Admin.findById(adminId);
        if(!foundAdmin){
            return next(new HttpError('This admin is not found', [{ message: 'Admin not found', type: 'Admin' }], 404))
        }
    } catch (err) {
        return next(new HttpError('Unable to find admin'))
    }

    let foundProducts;
    const receivedProducts = [];
    try {
        foundProducts = await Product.find({ creator: adminId });
        if(!foundProducts){
            return next(new HttpError('Unable to get the products for this admin'));
        }
        for (const k of foundProducts){
            receivedProducts.push({ id: k._id, title: k.title, price: k.price, isDiscount: k.isDiscount, isFinished: k.isFinished, newPrice: k.newPrice, category: k.category, image: k.image, description: k.description, region: k.region, creator: k.creator, creatorSubscription: k.creatorSubscription, creatorDetails: k.creatorDetails, createdAt: k.createdAt })
        }
    } catch (err) {
        return next(new HttpError('Unable to fetch products'))
    }
    res.status(200).json({ message: "Found admin products", name: foundAdmin.name, products: receivedProducts })
}

exports.productsPagination = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 5;
    let totalItems;
    let currentProducts = [];
    try {
        totalItems = await Product.find().countDocuments();
        const pageProducts = await Product.find().skip((currentPage - 1) * perPage).limit(perPage);
        for (const a of pageProducts){
            currentProducts.push({ id: a._id, title: a.title, price: a.price, isDiscount: a.isDiscount, isFinished: a.isFinished, newPrice: a.newPrice, category: a.category, image: a.image, description: a.description, creator: a.creator, creatorSubscription: a.creatorSubscription, region: a.region, creatorDetails: a.creatorDetails, createdAt: a.createdAt });
        }
    } catch (err) {
        return next(new HttpError('Unable to get the products for this page'));
    }
    res.status(200).json({ message: 'Found products for the current page', products: currentProducts, totalItems, perPage })
}

exports.createProduct = async (req, res, next) => {
    const { title, price, category, description, adminId } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for (const b of errorArray){
            messageArray.push({ message: b.msg, type: b.param })
        }
        return next(new HttpError('Unable to proceed', messageArray, 422));
    }
    let foundAdmin;
    try {
        foundAdmin = await Admin.findById(adminId.trim());
        if(!foundAdmin){
            const message = 'Admin not found';
            const type = 'admin';
            return next(new HttpError('The admin was not found', [{ message, type }], 404))
        }
    } catch (err) {
        return next(new HttpError('Unable to look for an admin'));
    }

    const now = new Date().getTime();
    const mySubscription = new Date(foundAdmin.subscription).getTime();

    if(now >= mySubscription){
        return next(new HttpError('Unable to create Product', [{ message: 'Your Subscription has expired', type: 'subscription' }], 403))
    }

    const productAlreadyAdded = foundAdmin.products.find(prod => prod.title === title);
    if(productAlreadyAdded){
        const message = 'The product has already been added';
        const type = 'product';
        return next(new HttpError('The product has already been added', [{ message, type }], 403))
    }

    const newProduct = new Product({ title, price: Number(price), isDiscount: false, isFinished: false, newPrice: 0, category, image: 'Yet to be added', description, region: foundAdmin.region, creator: foundAdmin._id, creatorSubscription: foundAdmin.subscription, creatorDetails: { name: foundAdmin.name, email: foundAdmin.email, phoneNumber: foundAdmin.phoneNumber } });

    try {
        await newProduct.save();
    } catch (err) {
        return next(new HttpError('Unable to create the product'));
    }

    const adminUpdatedProducts = [...foundAdmin.products, { id: newProduct._id, title: newProduct.title, price: newProduct.price, isDiscount: newProduct.isDiscount, isFinished: newProduct.isFinished, newPrice: newProduct.newPrice, category: newProduct.category, image: newProduct.image, description: newProduct.description, region: newProduct.region, creator: newProduct.creator, creatorSubscription: newProduct.creatorSubscription, creatorDetails: newProduct.creatorDetails, createdAt: newProduct.createdAt }];
    foundAdmin.products = adminUpdatedProducts;

    try {
        await foundAdmin.save();
    } catch (err) {
        return next(new HttpError('Unable to save the admin'));
    }

    res.status(201).json({ message: 'Product created successfully', id: newProduct._id, title: newProduct.title, price: newProduct.price, isDiscount: newProduct.isDiscount, isFinished: newProduct.isFinished, newPrice: newProduct.newPrice, category: newProduct.category, image: newProduct.image, description: newProduct.description, region: newProduct.region, creator: newProduct.creator, creatorSubscription: newProduct.creatorSubscription, creatorDetails: newProduct.creatorDetails, createdAt: newProduct.createdAt })
}

exports.addImage = async (req, res, next) => {
    const { image, adminId } = req.body;
    const productId = req.params.productId;

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for (const b of errorArray){
            messageArray.push({ message: b.msg, type: b.param })
        }
        return next(new HttpError('Unable to proceed', messageArray, 422));
    }

    let foundProduct;

    try {
        foundProduct = await Product.findById(productId.trim());
        if(!foundProduct){
            const message = 'The product was not found';
            const type = 'product';
            return next(new HttpError('Product was not found', [{ message, type }], 404))
        }
    } catch (err) {
        return next(new HttpError('Unable to find product'));
    }

    let foundAdmin;

    try {
        foundAdmin = await Admin.findById(adminId.trim());
        if(!foundAdmin){
            const message = 'The admin was not found';
            const type = 'admin';
            return next(new HttpError('Admin was not found', [{ message, type }], 404))
        }
    } catch (err) {
        return next(new HttpError('Unable to find admin'));
    }

    foundProduct.image = image;

    try {
        await foundProduct.save();
    } catch (err) {
        return next(new HttpError('Unable to save product'));
    }

    const theAdminProducts = foundAdmin.products;
    const productToUpdate = theAdminProducts.find(prod => prod.title === foundProduct.title);
    if(!productToUpdate){
        return next(new HttpError('Unable to look for product among ones that belong to this admin'));
    }
    productToUpdate.image = image;
    const filteredProducts = theAdminProducts.filter(prod => prod.title !== foundProduct.title);
    const newUpdatedProducts = [...filteredProducts, productToUpdate];
    foundAdmin.products = newUpdatedProducts;
    
    try {
        await foundAdmin.save();
    } catch (err) {
        return next(new HttpError('Unable to update the products of this admin'));
    }
    res.status(200).json({ message: 'Image added successfully', id: foundProduct._id, title: foundProduct.title, price: foundProduct.price, isDiscount: foundProduct.isDiscount, isFinished: foundProduct.isFinished, newPrice: foundProduct.newPrice, category: foundProduct.category, image: foundProduct.image, description: foundProduct.description, region: foundProduct.region, creator: foundProduct.creator, creatorSubscription: foundProduct.creatorSubscription, creatorDetails: foundProduct.creatorDetails, createdAt: foundProduct.createdAt });
}
 
exports.createCategory = async (req, res, next) => {
    const { title } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for (const b of errorArray){
            messageArray.push({ message: b.msg, type: b.param })
        }
        return next(new HttpError('Unable to proceed', messageArray, 422));
    }

    let foundCategory;

    try {
        foundCategory = await Category.findOne({ title });
        if(foundCategory){
            return next(new HttpError('This Category already exists', [{ message: 'This Category Already Exists', type: 'title' }], 422));
        }
    } catch (err) {
        return next(new HttpError('Unable to get category'));
    }

    const newCategory = new Category({ title });

    try {
        await newCategory.save();
    } catch(err) {
        return next(new HttpError('Unable to save the created category'));
    }
    res.status(201).json({ message: 'Category created successfully', id: newCategory._id, title: newCategory.title })
}

exports.createRegion = async (req, res, next) => {
    const { title } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for (const b of errorArray){
            messageArray.push({ message: b.msg, type: b.param })
        }
        return next(new HttpError('Unable to proceed', messageArray, 422));
    }

    let foundRegion;

    try {
        foundRegion = await Region.findOne({ title });
        if(foundRegion){
            return next(new HttpError('This region already exists', [{ message: 'This Region Already Exists', type: 'title' }], 422));
        }
    } catch (err) {
        return next(new HttpError('Unable to get region'));
    }

    const newRegion = new Region({ title });

    try {
        await newRegion.save();
    } catch(err) {
        return next(new HttpError('Unable to save the created region'));
    }
    res.status(201).json({ message: 'Region created successfully', id: newRegion._id, title: newRegion.title })
}

exports.editProduct = async (req, res, next) => {
    const { title, isDiscount, isFinished, newPrice, description, adminId } = req.body;
    const productId = req.params.productId.trim();
    let foundAdmin;

    try {
        foundAdmin = await Admin.findById(adminId);
        if(!foundAdmin){
            return next(new HttpError('This admin does not exist', [{ message: 'Admin does not exist', type: 'Admin' }], 404))
        }
    } catch (err) {
        return next(new HttpError('Unable to get admin'));
    }

    const now = new Date().getTime();
    const mySubscription = new Date(foundAdmin.subscription).getTime();
    if(now >= mySubscription){
        return next(new HttpError('Unable to create Product', [{ message: 'Your Subscription has expired', type: 'subscription' }], 403))
    }

    let foundProduct;

    try {
        foundProduct = await Product.findOne({ creator: adminId });
        if(!foundProduct){
            return next(new HttpError('You cannot edit this product', [{ message: 'This is not your product', type: 'Product' }], 403));
        }
    } catch (err) {
        return next(new HttpError('Unable to find product'));
    }

    foundProduct.title = title;
    foundProduct.isDiscount = isDiscount;
    foundProduct.isFinished = isFinished;
    foundProduct.newPrice = newPrice;
    foundProduct.description = description;

    try {
        await foundProduct.save();
    } catch (err) {
        return next(new HttpError('Unable to save edited product'))
    }

    res.status(200).json({ message: 'Product edited successfully', id: productId, title, price: foundProduct.price, isDiscount, isFinished, newPrice, category: foundProduct.category, image: foundProduct.image, description, region: foundProduct.region, creator: foundProduct.creator, creatorSubscription: foundProduct.creatorSubscription, creatorDetails: foundProduct.creatorDetails, createdAt: foundProduct.createdAt })

}

exports.deleteProduct = async (req, res, next) => {
    const productId = req.params.productId.trim();
    let foundProduct;
    let productImage;
    try {
        foundProduct = await Product.findByIdAndDelete(productId);
        if(!foundProduct){
            return next(new HttpError('Product does not exist', [{ message: 'Product was not found', type: 'product' }], 404))
        }
        productImage = foundProduct.image;
    } catch (err) {
        return next(new HttpError('Unable to find product'))
    }
    res.status(200).json({ message: 'Product deleted successfully', image:  productImage });
}

exports.addToCart = async (req, res, next) => {
    const { cart } = req.body;
    const personId = req.params.id.trim();
    let foundUser;
    let foundAdmin;
    try {
        foundUser = await User.findByIdAndUpdate(personId, { cart });
        if(!foundUser){
            foundAdmin = await Admin.findByIdAndUpdate(personId, { cart });
            if(!foundAdmin && !foundUser){
                return next(new HttpError('The admin does not exist', [{ message: 'Admin does not exist', type: 'admin' }], 404));
            }
            return next(new HttpError('The user does not exist', [{ message: 'User does not exist', type: 'user' }], 404))
        }
    } catch (err) {
        return next(new HttpError('Unable to look for admin and user'));
    }
    res.status(200).json({ message: 'Cart updated successfully', cart: cart });
}

exports.createOrder = async (req, res, next) => {
    const { order } = req.body;
    const personId = req.params.id.trim();

    let foundUser;
    let foundAdmin;
    try {
        foundUser = await User.findByIdAndUpdate(personId, { cart: [] });
        if(!foundUser){
            foundAdmin = await Admin.findByIdAndUpdate(personId, { cart: [] });
            if(!foundAdmin && !foundUser){
                return next(new HttpError('The admin does not exist', [{ message: 'Admin does not exist', type: 'admin' }], 404));
            }
            return next(new HttpError('The user does not exist', [{ message: 'User does not exist', type: 'user' }], 404))
        }
    } catch (err) {
        return next(new HttpError('Unable to look for admin and user'));
    }

    const newOrder = new Order({ totalPrice: order.totalPrice, productsOrdered: order.productsOrdered, customerName: order.customerName, customerId: order.customerId, customerPhoneNumber: order.customerPhoneNumber, customerEmail: order.customerEmail, sellers: order.sellers });

    try {
        await newOrder.save();
    } catch (err) {
        return next(new HttpError('Unable to save the order'))
    }

    const createdOrder = { id: newOrder._id, totalPrice: newOrder.totalPrice, productsOrdered: newOrder.productsOrdered, customerName: newOrder.customerName, customerPhoneNumber: newOrder.customerPhoneNumber, customerEmail: newOrder.customerEmail, sellers: newOrder.sellers, createdAt: newOrder.createdAt };

    if(foundUser){
        foundUser.cart = [];
        foundUser.orders = [...foundUser.orders, createdOrder];
    } else if(foundAdmin){
        foundAdmin.cart = [];
        foundAdmin.orders = [...foundAdmin.orders, createdOrder];
    }

    try {
        if(foundUser){
            await foundUser.save();
        } else if (foundAdmin){
            await foundAdmin.save();
        }
    } catch (err) {
        return next(new HttpError('Unable to save the person'))
    }   

    const responses = [];
    for (const a of order.sellers) {
        const oneResponse = order.productsOrdered.filter((prod) => prod.creator === a.id);
        responses.push({ creator: a.id, creatorName: a.name, creatorPhoneNumber: a.phoneNumber, productsOrdered: oneResponse });
    }

    res.status(201).json({ message: 'Order created Successfully', responses })
}