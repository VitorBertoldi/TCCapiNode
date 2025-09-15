import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { employees } from './routes/employees';
import { payrollEntries } from './routes/payrollEntries';
import { payrolls } from './routes/payrolls';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/employees', employees);
app.use('/payroll-entries', payrollEntries);
app.use('/payrolls', payrolls);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`API up on http://0.0.0.0:${port}`);
});
