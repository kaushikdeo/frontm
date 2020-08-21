const router = require('express').Router();
const Food = require('../../models/Food');
const mongoose = require('mongoose');
const validator = require('validator');

router.get('/', async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const sortBy = req.query.sortBy ? req.query.sortBy.toString() : 'itemName';
    const orderBy = parseInt(req.query.orderBy) === 1 ? 1 : -1;
    const filterString = req.query.filter ? req.query.filter.toString() : '';
    const sortQuery = {
        [sortBy]: orderBy
    };
    const filterQuery = {
        itemName: new RegExp(filterString, 'i')
    }
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    let results = {};
    try {
        const foodsLength = await Food.countDocuments(filterQuery);
        if (((page * limit) > foodsLength) && (page * limit) - foodsLength > limit) {
            return res.status(400).json({message: 'Invalid page'})
        }
        if (endIndex < foodsLength) {
            results.next = {
                page: page + 1,
                limit,
            }
        }
        if (startIndex > 0) {
            results.previous = {
                page: page - 1,
                limit,
            }
        }
    } catch (error) {
        console.log('Some Error Occured', error);
        return res.status(400).json({message: "Error occured while counting Entries"});
    }
    Food.find(filterQuery).limit(limit).skip(startIndex).sort(sortQuery)
        .then(allFoods => {
            const totalTime = process.hrtime(req.queryStartTime);
            results.foods = allFoods;
            results.totalExecutionTime = `${totalTime[0]} s ${totalTime[1]/1000000} ms`;
            return res.status(200).json(results);
        })
        .catch(err => {
            console.log('error occured while fetching all foods', err);
            res.status(500).json({message: "error occured while fetching all foods"});
        })
})

router.post('/', async (req, res, next) => {
    if (!req.body) {
        return res.status(400).json({messgae: 'Invalid input fields'});
    }
    // validation
    const itemName = validator.escape(req.body.itemName);
    const foodType = validator.escape(req.body.foodType);
    const cusineType = validator.escape(req.body.cusineType);
    const session = await mongoose.startSession();
    session.startTransaction();
    const food = new Food({
        itemName,
        cost: req.body.cost,
        foodType,
        cusineType,
        inventory: req.body.inventory,
    }, { _id: true, session });
    food.save()
        .then(async (savedFood) => {
            await session.commitTransaction();
            session.endSession();
            const totalTime = process.hrtime(req.queryStartTime);
            return res.status(200).json({savedFood, totalExecutionTime: `${totalTime[0]} s ${totalTime[1]/1000000} ms`});
        })
        .catch(async (err) => {
            await session.abortTransaction();
            session.endSession();
            console.log('error while saving food item', err);
            return res.status(500).json({message: 'Error occured while saving new food item'});
        })
})

module.exports = router;