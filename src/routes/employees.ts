import { Router } from 'express';
import { prisma } from '../db/prisma';

export const employees = Router();

employees.post('/', async (req, res) => {
  const { name, document, baseSalary, dependents = 0, unionMember = false } = req.body;
  const emp = await prisma.employees.create({
    data: {
      name, document,
      base_salary: baseSalary,
      dependents, union_member: unionMember
    }
  });
  res.status(201).json(emp);
});

employees.get('/', async (_req, res) => {
  const list = await prisma.employees.findMany({ take: 1000 });
  res.json(list);
});
