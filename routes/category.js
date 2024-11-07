const express = require('express');
const router = express.Router();
const Client = require('../models/Category');
var fetchuser = require('../middleware/fetchuser');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require("../helper/cloudinaryconfig")

// Ensure the uploads directory exists

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, `image-${Date.now()}.${file.originalname}`);
    }
});

const isImage = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true)
    } else {
        cb(new Error("only image is allowed"))
    }
}

const upload = multer({
    storage: storage,
    fileFilter: isImage
});

// route1 : Get all category using GET: "/api/category/fetchallcategory" login required
router.get('/fetchallcategory', fetchuser, async (req, res) => {
    try {
        const clients = await Client.find({ user: req.user.id });
        res.json(clients);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route2 : Add new category using POST: "/api/category/addcategory" login required
router.post('/addcategory', fetchuser, [
    body('category', 'Enter a valid category').isLength({ min: 3 }),
], async (req, res) => {
    try {
        const { category } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const Category = new Client({
            category,
            user: req.user.id
        });
        const savedCategory = await Category.save();
        res.json(savedCategory);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route3 : Update category using PUT: "/api/category/updatecategory/:id" login required
router.put('/updatecategory/:id', fetchuser, async (req, res) => {
    const { category } = req.body;

    try {
        // Create a newClient object 
        const newCategory = {};
        if (category) { newCategory.category = category; }
        let categoryup = await Client.findById(req.params.id);
        if (!categoryup) {
            return res.status(404).send("Not Found");
        }
        if (categoryup.user.toString() !== req.user.id) {
            return res.status(404).send("Not Allowed");
        }

        categoryup = await Client.findByIdAndUpdate(req.params.id, { $set: newCategory }, { new: true });
        res.json(categoryup);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// route4 : Delete category using DELETE: "/api/category/deletecategory/:id" login required
router.delete('/deletecategory/:id', fetchuser, async (req, res) => {
    try {
        // Find the client to be deleted and delete it
        let client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).send("Not Found");
        }

        // Allow deletion only if user owns this client
        if (client.user.toString() !== req.user.id) {
            return res.status(404).send("Not Allowed");
        }

        client = await Client.findByIdAndDelete(req.params.id);
        res.json({ "Success": "Blog has been deleted", client: client });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// ..........................SUBCATEGORY............................

// route1 : Get subcategory by categoryid using GET: "/api/category/:clientId/getsubcategory" login required
router.get('/:categoryId/getsubcategory', fetchuser, async (req, res) => {
    try {
        const category = await Client.findOne({ _id: req.params.categoryId, user: req.user.id });
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }
        const subcategories = category.subcategories;
        res.json(subcategories);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

// Add Subcategory ROUTE: /api/category/:id/subcategories
router.post('/:clientId/subcategories', async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "category not found" });
        }

        const { subCategory, subCategorydesc, location, interval, metaTag, metaTitle, metaDesc } = req.body;
        // const imageUrl = ((await cloudinary.uploader.upload(req.file.path)).secure_url);

        // if (!imageUrl) {
        //     return res.status(400).json({ errors: [{ msg: 'Subcategory image URL is required' }] });
        // }

        client.subcategories.push({ subCategory, subCategorydesc, location, interval, metaTag, metaTitle, metaDesc, });
        await client.save();

        res.status(201).json({ message: "Subcategory added successfully" });
    } catch (error) {
        console.error("Error adding subcategory:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Edit Subcategory ROUTE: /api/category/:clientId/subcategories/:subcategoryId
router.put('/:clientId/subcategories/:subcategoryId', async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "subcategory not found" });
        }

        const { subCategory, subCategorydesc, location, interval, metaTag, metaTitle, metaDesc } = req.body;
        const subcategory = client.subcategories.find(sub => sub._id.toString() === req.params.subcategoryId);
        if (subcategory) {
            subcategory.subCategory = subCategory || subcategory.subCategory;
            subcategory.subCategorydesc = subCategorydesc || subcategory.subCategorydesc;
            subcategory.location = location || subcategory.location;
            subcategory.interval = interval || subcategory.interval;
            subcategory.metaTag = metaTag || subcategory.metaTag;
            subcategory.metaTitle = metaTitle || subcategory.metaTitle;
            subcategory.metaDesc = metaDesc || subcategory.metaDesc;

            // if (req.file) {
            //     const result = await cloudinary.uploader.upload(req.file.path);
            //     subcategory.imageUrl = result.secure_url;
            // }
            // if (req.file) {
            //     subcategory.imageUrl = ((await cloudinary.uploader.upload(req.file.path)).secure_url);
            // }

            await client.save();
            res.json({ message: "subcategory updated successfully" });
        } else {
            res.status(404).json({ error: "subcategory not found" });
        }
    } catch (error) {
        console.error("Error updating subcategory detail:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




// Delete Subcategory ROUTE: /api/category/:clientId/subcategories/:subcategoryId
router.delete('/:clientId/subcategories/:subcategoryId', async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "subcategory not found" });
        }

        const subcategoryIndex = client.subcategories.findIndex(sub => sub._id.toString() === req.params.subcategoryId);
        if (subcategoryIndex !== -1) {
            client.subcategories.splice(subcategoryIndex, 1);
            await client.save();
            res.json({ Success: "subcategory deleted successfully" });
        } else {
            res.status(404).json({ error: "subcategory not found" });
        }
    } catch (error) {
        console.error("Error deleting subcategory:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Add tour ROUTE: /api/category/:id/subcategories/:subcategoryId/tour
router.post('/:clientId/subcategories/:subcategoryId/tour', async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }
        const subcategory = client.subcategories.id(req.params.subcategoryId);
        if (!subcategory) {
            return res.status(404).json({ error: "Subcategory not found" });
        }
        const { name, day, description } = req.body;

        // Optional image upload
        // let imageUrl;
        // if (req.file) {
        //     imageUrl = (await cloudinary.uploader.upload(req.file.path)).secure_url;
        // } else {
        //     return res.status(400).json({ error: "Tour image URL is required" });
        // }

        subcategory.tour.push({ name, day, description /*, imageUrl */ });
        await client.save();

        res.status(201).json({ message: "Tour added successfully", tour: { name, day, description /*, imageUrl */ } });
    } catch (error) {
        console.error("Error adding tour:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Edit tour ROUTE: /api/category/:id/subcategories/:subcategoryId/tour/:tourId
router.put('/:clientId/subcategories/:subcategoryId/tour/:tourId', async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }
        const subcategory = client.subcategories.id(req.params.subcategoryId);
        if (!subcategory) {
            return res.status(404).json({ error: "Subcategory not found" });
        }
        const tour = subcategory.tour.id(req.params.tourId);
        if (!tour) {
            return res.status(404).json({ error: "Tour not found" });
        }

        const { name, day, description } = req.body;
        tour.name = name || tour.name;
        tour.day = day || tour.day;
        tour.description = description || tour.description;

        // Optional image upload handling
        // if (req.file) {
        //     const result = await cloudinary.uploader.upload(req.file.path);
        //     tour.imageUrl = result.secure_url;
        // }

        // Save the changes to the client document
        await client.save();

        res.json({ message: "Tour updated successfully", tour });
    } catch (error) {
        console.error("Error updating tour:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Delete tour ROUTE: /api/category/:id/subcategories/:subcategoryId/tour/:tourId
router.delete('/:clientId/subcategories/:subcategoryId/tour/:tourId', async (req, res) => {
    try {
        const client = await Client.findById(req.params.clientId);
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }
        const subcategory = client.subcategories.id(req.params.subcategoryId);
        if (!subcategory) {
            return res.status(404).json({ error: "Subcategory not found" });
        }
        const tourIndex = subcategory.tour.findIndex(sub => sub._id.toString() === req.params.tourId);
        // console.log(subcategoryIndex, "subcategory index");
        if (tourIndex !== -1) {
            subcategory.tour.splice(tourIndex, 1);
            await client.save();
            res.json({ Success: "tour deleted successfully" });
        } else {
            res.status(404).json({ error: "tour not found" });
        }
    } catch (error) {
        console.error("Error updating tour:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;