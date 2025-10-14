import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { computePayroll } from '../services/payrollCalculator';
import { Decimal } from '@prisma/client/runtime/library';

export const payrolls = Router();

/**
 * Endpoint de processamento real (grava no banco)
 */
payrolls.post('/process', async (req: Request, res: Response) => {
  const period = (req.query.period as string) || req.body?.period;
  if (!period) return res.status(400).json({ error: "Missing 'period' (YYYY-MM)" });

  const entries = await prisma.payroll_entries.findMany({
    where: { period },
    include: { employee: true },
  });

  if (entries.length === 0) return res.status(204).send();

  const results: any[] = [];
  const chunkSize = 200;

  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);

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

/**
 * GET para conferência (consulta real no banco)
 */
payrolls.get('/period/:p', async (req: Request, res: Response) => {
  const list = await prisma.payrolls.findMany({
    where: { period: req.params.p },
    take: 1000,
  });

  res.json(
    list.map((p) => ({
      id: p.id,
      employeeId: p.employee_id,
      period: p.period,
      grossSalary: p.gross_salary,
      inss: p.inss,
      incomeTax: p.income_tax,
      netSalary: p.net_salary,
    }))
  );
});

/**
 * 🔹 Endpoint apenas para stress test
 * Simula o cálculo da folha sem usar banco de dados
 */
payrolls.get('/stress/fake', async (req: Request, res: Response) => {
  const count = parseInt((req.query.count as string) || '1000', 10);
  const period = (req.query.period as string) || '2025-08';

  const results = [];

  for (let i = 0; i < count; i++) {
    const employee = {
      id: i + 1,
      base_salary: 3000 + (i % 5) * 500, // valores entre 3000–5000
      dependents: i % 3,
    };

    const entry = {
      overtime_hours: i % 10,
      bonus: (i % 300) / 10,
      discounts: (i % 200) / 10,
    };

    // cálculo puro em memória
    const r = computePayroll({
      baseSalary: new Decimal(employee.base_salary),
      dependents: employee.dependents,
      overtimeHours: new Decimal(entry.overtime_hours),
      bonus: new Decimal(entry.bonus),
      discounts: new Decimal(entry.discounts),
    });

    results.push({
      employeeId: employee.id,
      period,
      grossSalary: r.gross,
      inss: r.inss,
      incomeTax: r.irrf,
      netSalary: r.net,
    });
  }

  res.json(results);
});
