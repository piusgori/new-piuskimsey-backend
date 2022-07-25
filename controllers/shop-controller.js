const Product = require('../models/product');
const Category = require('../models/category');
const HttpError = require('../models/http-error');

exports.getProducts = async (req, res, next) => {
    let fetchedProducts = [];
    try { 
        const products = await Product.find();
        if(!products){
            return next(new HttpError('We were unable to fetch the products'));
        }
        for (const a of products){
            fetchedProducts.push({ id: a._id, title: a.title, price: a.price, isDiscount: a.isDiscount, isFinished: a.isFinished, newPrice: a.newPrice, category: a.category, image: a.image, description: a.description, creator: a.creator, region: a.region, createdAt: a.createdAt });
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