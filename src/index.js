const express = require('express');
const { calculatePayroll } = require('./services/payrollCalculator');

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/payrolls/stress/fake', (req, res) => {
  const { period = '2025-08' } = req.query;
  const countParam = parseInt(req.query.count, 10);
  const count = Number.isFinite(countParam) && countParam > 0 ? countParam : 1000;

  const payroll = calculatePayroll({ period, count });
  res.json(payroll);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});
