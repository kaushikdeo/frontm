const express = require('express');
const mongoose = require('mongoose');
const Food = require('./models/Food');

const app = express();
// code-review - Should take it from process.env
mongoose.connect('mongodb+srv://kaushikmdeo:kaushik123@frontm.zltir.mongodb.net/frontm?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
// code-review - Have a separate helper to populate data
try {
    db.once('open', async () => {
        if (await Food.countDocuments().exec() > 0) return
        for (let i = 0; i < 20; i++) {
            Food.create({
                itemName: `Food ${i}`,
                cusineType: i%5 === 0 ? 'continental' : 'indian',
                foodType: i%3 === 0 ? 'breakfast' : 'dinner',
                cost: i * 10,
                inventory: i*20,
            })
        }
    })
} catch (error) {
    console.log('error', error);
}

app.use((req, res, next) => {
    req.queryStartTime = process.hrtime();
    next();
});
// code-review - Have a separate file for all these middleware
const pagination = () => async (req, res, next) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = {}
    // code-review - you cannot have specific mongo query here
    // code-review - this should be strictly for pagination and can be used for other apis too
    const foodsLength = await Food.countDocuments().exec();
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
    try {
        results.foods = await Food.find().limit(limit).skip(startIndex).exec();
        res.paginatedFoods = results;
        next();
    } catch (error) {
        console.log('error', error);
    }
}

const searchResults = () => (req, res, next) => {
    const searchQuery = req.query.search.toString();
    // code-review - No console.log
    console.log('searchquery', searchQuery);
    
    next();
}

const sorting = () => (req, res, next) => {
    // code-review - Not specific to food here
    const paginationResult = res.paginatedFoods;
    parseInt(req.query.sort) === 1 ? 
    paginationResult.foods.sort((a, b) => (a.itemName.toLowerCase() > b.itemName.toLowerCase()) ? 1 : -1) :
    paginationResult.foods.sort((a, b) => (a.itemName.toLowerCase() > b.itemName.toLowerCase()) ? -1 : 1);
    res.sortedFoods = paginationResult;
    next();
}

const logQueryTime = () => (req, res, next) => {
    const totalTime = process.hrtime(req.queryStartTime);
    res.sortedFoods.totalExecutionTime = `${totalTime[0]} s ${totalTime[1]/1000000} ms`;
    next();
}

app.get('/', (req, res) => {
    res.send('Welcome to Flight Food Ordering');
})

// code-review - all these are query variables and not middlewares. imagine you have many apis like `/food` how do you plan to reuse these
app.get('/foods', searchResults(), pagination(), sorting(), logQueryTime(), (req, res) => {
    res.json(res.sortedFoods);
});


app.listen('3000', () => console.log('Server started on port 3000'));
