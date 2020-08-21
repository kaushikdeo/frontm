// code-review - see Foods/index.js
const Order = require('../../models/Order');
const Food = require('../../models/Food');
const mongoose = require('mongoose');
const router = require('express').Router();

router.get('/', (req, res, next) => {
    res.status(200).json({msg: 'orders api endpoint'});
})

router.post('/', async (req, res, next) => {
    if (!req.body) {
        return res.status(400).json({messgae: 'Invalid input fields'});
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    const order = new Order({
        orderItems: req.body,
    }, {_id: true, session});
        order.save()
            .then(async (savedOrder) => {
                await Promise.all((savedOrder.orderItems.map(async (foodItem) => {
                    const isFoodQuantity = await Food.findOne({
                        _id: foodItem.foodItem,
                        inventory: {$gte: foodItem.itemCount}
                    },{ session: session });
                    console.log('isFoodQuantity', isFoodQuantity);
                    if (!isFoodQuantity) throw new Error('one of the food item out of stock');
                    await Food.findOneAndUpdate({
                        _id: foodItem.foodItem,
                        inventory: {$gte: foodItem.itemCount}
                    }, {
                        $inc: {
                            inventory: -foodItem.itemCount,
                        }
                    })
                })))
                await session.commitTransaction();
                session.endSession();
                const totalTime = process.hrtime(req.queryStartTime);
                return res.status(200).json({savedOrder, totalExecutionTime: `${totalTime[0]} s ${totalTime[1]/1000000} ms`});
            }, { session: session })
            .catch(async (err) => {
                console.log('I am caught');
                await session.abortTransaction();
                session.endSession();
                return res.status(500).json({message: 'Error occured while saving new food item'});
            })
})

module.exports = router;
