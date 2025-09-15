import { Router } from 'express';
import { prisma } from '../db/prisma';

export const payrollEntries = Router();

payrollEntries.post('/', async (req, res) => {
  const { employeeId, period, overtimeHours = 0, bonus = 0, discounts = 0 } = req.body;

  // garante que o funcionário existe
  const emp = await prisma.employees.findUnique({ where: { id: employeeId }});
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  const entry = await prisma.payroll_entries.upsert({
    where: { uk_entry_emp_period: { employee_id: employeeId, period } },
    update: { overtime_hours: overtimeHours, bonus, discounts },
    create: { employee_id: employeeId, period, overtime_hours: overtimeHours, bonus, discounts }
  });

  res.status(201).json(entry);
});

payrollEntries.get('/period/:p', async (req, res) => {
  const entries = await prisma.payroll_entries.findMany({
    where: { period: req.params.p },
    take: 1000
  });
  res.json(entries);
});
