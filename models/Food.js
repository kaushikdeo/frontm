const {Schema, SchemaTypes, model} = require('mongoose');
const uuid = require('uuid/v4');


const FoodSchema = new Schema({
    itemName: {
        type: String,
        required: true,
    },
    cost: {
        type: Number,
        required: true,
    },
    foodType: {
        type: String,
        required: true,
    },
    cusineType: {
        type: String,
        required: true,
    },
    inventory: {
        type: Number,
        required: true,
    }
}, {timestamps: true})

module.exports = model('Food', FoodSchema);