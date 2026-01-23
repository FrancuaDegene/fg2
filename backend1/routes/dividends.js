const express = require('express');

const router = express.Router();

router.get('/dividends', (req, res) => {
  res.json([
    { date: '2024-12-15', value: '1.50', currency: 'RUB', type: 'Годовые' },
    { date: '2024-06-30', value: '0.75', currency: 'RUB', type: 'Промежуточные' },
  ]);
});

module.exports = router;
