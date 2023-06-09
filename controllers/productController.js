const { default: slugify } = require("slugify");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
require('dotenv').config({path:"../.env"});
var braintree = require("braintree");

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

const fs = require('fs');
const { BraintreeGateway } = require("braintree");


// Payment Gateway
const paymentGateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID,
    privateKey: process.env.BRAINTREE_PRIVATE_KEY,
    publicKey: process.env.BRAINTREE_PUBLIC_KEY,
})


exports.createProductController = async (req, res) => {
    try {
        const {name, description, slug, price, category, quantity, shipping} = req.fields;
        const {photo} = req.files
        // Validation
        switch(true){
            case !name: 
                return res.status(404).send({error: "Name is required"})
            case !description: 
                return res.status(404).send({error: "Description is required"})
            case !price: 
                return res.status(404).send({error: "Price is required"})
            case !category: 
                return res.status(404).send({error: "Category is required"})
            case !quantity: 
                return res.status(404).send({error: "Quantity is required"})
            case !shipping: 
                return res.status(404).send({error: "Shipping is required"})
            case photo && photo.size > 10000000: 
                return res.status(404).send({error: "Photo is required and should be less than 1Mb"})
        }
        const newProduct = new Product({...req.fields, slug: slugify(name)});

        if(photo) {
            newProduct.photo.data = fs.readFileSync(photo.path)
            newProduct.photo.contentType = photo.type
        }
        await newProduct.save();
        
        res.status(201).send({
            success: true,
            message: "Product created successfully",
            newProduct
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error while creating product",
            success: false
        });
    }
}

exports.deleteProductController = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.pid).select("-photo")
        res.status(200).send({
            success: true,
            message: "Product deleted successfully",
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while deleting product"
        })
    }
}

exports.UpdateProductController = async (req, res) => {
    try {
        console.log(req.fields);
        console.log(req);
        console.log(req.body);

        const {name, description, slug, price, category, quantity, shipping} = req.fields
        const {photo} = req.files
        // Validation
        
        const newProduct = await Product.findByIdAndUpdate(req.params.pid, 
            {...req.fields, slug: slugify(name)},
            {new: true}
            )
        if(photo) {
            newProduct.photo.data = fs.readFileSync(photo.path)
            newProduct.photo.contentType = photo.type
        }
        await newProduct.save()
        res.status(201).send({
            success: true,
            message: "Product updated successfully",
            newProduct
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error while update product",
            success: false
        })
    }
}

exports.getAllProductsController = async (req, res) => {
    try {
        const products = await Product.find({}).populate("category").select("-photo").limit(12).sort({createdAt: -1})
        res.status(200).send({
            success: true,
            message: "All Products",
            totalCount: products.length,
            products,
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while fetching products"
        })
    }
}

exports.getProductController = async (req, res) => {
    try {
        const product = await Product.findOne({slug: req.params.slug}).select("-photo").populate("category")
        res.status(200).send({
            success: true,
            message: "Product Fetched Successfully",
            product
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while fetching the product"
        })
    }
}

exports.getProductPhotoController = async (req, res) => {
    try {
        const product = await Product.findById(req.params.pid).select("photo")
        if(product.photo.data){
            res.set("Content-type", product.photo.contentType)
            return res.status(200).send(product.photo.data)
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error while getting photo"
        })
    }
}

exports.getFilterController = async (req, res) => {
    try {
        const { checked, price } = req.body
        let args = {}
        if(checked.length > 0) {
            args.category = checked;
        }
        if(price.length) {
            args.price = {$gte: price[0], $lte: price[1] }
        }
        const products = await Product.find(args)
        res.status(200).send({
            success: true,
            products
        })
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success:false,
            message: "Error while filtering product"
        })
    }
}


// Payment Gateway API
// -->TOken
exports.brainTreeTokenController = async (req, res) => {
    try {
        paymentGateway.clientToken.generate({}, (err, response) => {
            if(err) {
                res.status(500).send(err)
            }else {
                res.send(response)
            }
        })         
    } catch (error) {
        console.log(error);
    }
}

// Payment Gateway API
// --> Payment
exports.brainTreePaymentController = async (req, res) => {
    try {
        const {cart, nonce} = req.body;
        let total = 0;
        cart.map(item => total += item.price);
        let newTransaction = paymentGateway.transaction.sale({
            amount:total,
            paymentMethodNonce: nonce,
            options: {
                submitForSettlement: true
            }
        },
        function(error, result){
            if(result) {
                const order = new Order({
                    products: cart,
                    payment: result,
                    buyer: req.user._id,
                }).save()
                res.json({ok: true})
            }else {
                res.status(500).send(error)
            }
        }
        )
    } catch (error) {
        console.log(error);
    }
}

// paymeny by stripe controller 
exports.paymentController = async (req, res) => {

  const line_items = req.body.cart.map(item => {
    return {
      price_data: {
        currency: 'aud',
        product_data: {
          name: item.name,
          description: item.description,
          metadata: {
            id: item._id
          }
        },
        unit_amount: item.price * 10,
      },
      quantity: item.quantity,
    }
  })

  const session = await stripe.checkout.sessions.create({
    
    line_items,
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/checkout-success`,
    cancel_url: `${process.env.CLIENT_URL}/cart`,
  });

  res.send({url: session.url});
}