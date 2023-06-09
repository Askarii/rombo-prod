const { default: slugify } = require("slugify");
const Category = require("../models/categoryModel");
const { findOneAndDelete } = require("../models/userModel");


exports.createCategoryController = async (req, res) => {
    try {
        const {name} = req.body;
        if(!name) {
            return res.status(401).send({
                message: "Name is required"
            })
        }
        const existingCategory = await Category.findOne({name})
        if(existingCategory) {
            return res.status(200).send({
                success: true,
                message: "Category already exist"
            })
        }
        const newCategory = await new Category({name, slug: slugify(name)}).save()
        res.status(201).send({
            success: true,
            message: "New Category Created",
            newCategory
        })
    } catch (error) {
        console.log("Error");
        res.status(500).send({
            success: false,
            error: error,
            message: "Error in Category"
        })
    }
}

exports.updateCategoryController = async (req, res) => {
    try {
        const {name} = req.body;
        const {id} = req.params;
        const category = await Category.findByIdAndUpdate(id, {name,slug:slugify(name)},{new: true})
        res.status(200).send({
            success: true,
            message: "Category Updated Successfully",
            category
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error while Updating category"
        })
    }
}

exports.getAllCategoryController = async (req, res) => {
    try {
        const category = await Category.find()
        res.status(200).send({
            success: true,
            message: "All categories list",
            category
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success:false,
            error,
            message: "Error while getting all categories"
        })
    }
}

exports.getSingleCategoryController = async (req, res) => {
    try {
        const category = await Category.findOne({slug: req.params.slug})
        res.status(200).send({
            success:true,
            message: "Get Single Category fetched successfully",
            category
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error while getting the category"
        })
    }
}

exports.deleteCategoryController = async (req, res) => {
    try {
        const {id} = req.params;
        await Category.findOneAndDelete(id)
        res.status(200).send({
            success: true,
            message: "Category deleted successfully"
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            error,
            message: "Error while deleting category"
        })
    }
}