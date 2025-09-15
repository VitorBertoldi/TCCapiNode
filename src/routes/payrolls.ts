import { Router } from 'express';
import { prisma } from '../db/prisma';
import { computePayroll } from '../services/payrollCalculator';

export const payrolls = Router();

// Processa todos os lançamentos do período
payrolls.post('/process', async (req, res) => {
  const period = (req.query.period as string) || req.body?.period;
  if (!period) return res.status(400).json({ error: "Missing 'period' (YYYY-MM)" });

  // Busca entries + empregado
  const entries = await prisma.payroll_entries.findMany({
    where: { period },
    include: { employee: true },
  });

  if (entries.length === 0) return res.status(204).send();

  const results: any[] = [];
  const chunkSize = 200;

  // Divide em chunks para não sobrecarregar
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);

    // Processa SEQUENCIAL dentro do chunk
    for (const inRow of chunk) {
      const e = inRow.employee!;
      const r = computePayroll({
        baseSalary: e.base_salary,
        dependents: e.dependents,
        overtimeHours: inRow.overtime_hours,
        bonus: inRow.bonus,
        discounts: inRow.discounts,
      });

      const saved = await prisma.payrolls.upsert({
        where: { uk_payroll_emp_period: { employee_id: e.id, period } },
        update: {
          gross_salary: r.gross,
          inss: r.inss,
          income_tax: r.irrf,
          net_salary: r.net,
        },
        create: {
          employee_id: e.id,
          period,
          gross_salary: r.gross,
          inss: r.inss,
          income_tax: r.irrf,
          net_salary: r.net,
        },
      });

      results.push({
        id: saved.id,
        employeeId: e.id,
        period: saved.period,
        grossSalary: saved.gross_salary,
        inss: saved.inss,
        incomeTax: saved.income_tax,
        netSalary: saved.net_salary,
      });
    }
  }

  res.json(results);
});

// GET de conferência
payrolls.get('/period/:p', async (req, res) => {
  const list = await prisma.payrolls.findMany({
    where: { period: req.params.p },
    take: 1000
  });
  res.json(list.map(p => ({
    id: p.id,
    employeeId: p.employee_id,
    period: p.period,
    grossSalary: p.gross_salary,
    inss: p.inss,
    incomeTax: p.income_tax,
    netSalary: p.net_salary
  })));
});
