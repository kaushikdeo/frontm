const {Schema, SchemaTypes, model} = require('mongoose');
const uuid = require('uuid/v4');

const OrderObjectSchema = new Schema({
    foodItem: {
        type: Schema.Types.ObjectId,
        ref: "Food",
        required: true,
    },
    itemCount: {
        type: Number,
        required: true,
        default: 1,
    }
}, {_id: false})


const OrderSchema = new Schema({
    orderItems: [OrderObjectSchema],
}, {timestamps: true})

module.exports = model('Order', OrderSchema);