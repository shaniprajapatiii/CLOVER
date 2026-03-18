const express = require('express');
const router = express.Router();
const { getPlanOptions, createPolicy, getMyPolicies, getPolicyById, renewPolicy, cancelPolicy } = require('../controllers/policyController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/plans', getPlanOptions);
router.get('/', getMyPolicies);
router.post('/', createPolicy);
router.get('/:id', getPolicyById);
router.post('/:id/renew', renewPolicy);
router.patch('/:id/cancel', cancelPolicy);

module.exports = router;
