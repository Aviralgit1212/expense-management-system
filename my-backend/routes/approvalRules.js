const express = require('express');
const router = express.Router();
const approvalRulesController = require('../controllers/approvalRulesController');

router.get('/', approvalRulesController.getAllRules);
router.post('/', approvalRulesController.saveRule);
router.delete('/:id', approvalRulesController.deleteRule);

module.exports = router;
