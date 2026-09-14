const { Router } = require('express');
const { register, login, createDonation } = require('../controllers/controllers.js');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/createDonation', createDonation)



module.exports = router;