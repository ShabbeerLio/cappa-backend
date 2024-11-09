const mongoose = require('mongoose');

const TourSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    day: {
        type: String,
    },
    description: {
        type: String
    },
    imageUrl: {
        type: String
    }
});

const SubcategorySchema = new mongoose.Schema({
    subCategory: {
        type: String,
    },
    subCategorydesc: {
        type: String,
    },
    location: {
        type: String,
    },
    interval: {
        type: String,
    },
    metaTag: {
        type: String,
    },
    metaTitle: {
        type: String,
    },
    metaDesc: {
        type: String,
    },
    subCatimageUrl: {
        type: String,
    },
    about1imageUrl: {
        type: String,
    },
    about2imageUrl: {
        type: String,
    },
    tour: [TourSchema],
});

const CategorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    category: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    },
    subcategories: [SubcategorySchema],
});

module.exports = mongoose.model('Category', CategorySchema);