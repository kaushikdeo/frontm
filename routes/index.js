const router = require('express').Router();

router.use('/foods', require('./foods'));
router.use('/orders', require('./orders'));
router.get('/', (req, res, next) => {
    res.status(200).json({message: 'this is the api endpoint'});
})

module.exports = router;