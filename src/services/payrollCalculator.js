const DEPENDENT_DEDUCTION = 189.59;

const inssBrackets = [
  { limit: 1412.0, rate: 0.075 },
  { limit: 2666.68, rate: 0.09 },
  { limit: 4000.03, rate: 0.12 },
  { limit: Infinity, rate: 0.14 }
];

const irrfBrackets = [
  { limit: 2112.0, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 158.4 },
  { limit: 3751.05, rate: 0.15, deduction: 370.4 },
  { limit: 4664.68, rate: 0.225, deduction: 651.73 },
  { limit: Infinity, rate: 0.275, deduction: 884.96 }
];

function calculateGrossSalary({ baseSalary, overtimeHours, bonus, discounts }) {
  const hourlyRate = baseSalary / 160;
  const overtimePay = overtimeHours * hourlyRate * 1.5;
  return baseSalary + overtimePay + bonus - discounts;
}

function calculateInss(grossSalary) {
  let remaining = grossSalary;
  let previousLimit = 0;
  let total = 0;

  for (const bracket of inssBrackets) {
    const taxable = Math.min(remaining, bracket.limit - previousLimit);
    if (taxable <= 0) {
      break;
    }

    total += taxable * bracket.rate;
    remaining -= taxable;
    previousLimit = bracket.limit;

    if (remaining <= 0) {
      break;
    }
  }

  return Number(total.toFixed(2));
}

function calculateIncomeTax(grossSalary, inss, dependents) {
  const taxableIncome = grossSalary - inss - dependents * DEPENDENT_DEDUCTION;
  if (taxableIncome <= 0) {
    return 0;
  }

  const bracket = irrfBrackets.find(({ limit }) => taxableIncome <= limit);
  const tax = taxableIncome * bracket.rate - bracket.deduction;
  return Number(Math.max(tax, 0).toFixed(2));
}

function generateDeterministicRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildEmployeeData(index) {
  const random1 = generateDeterministicRandom(index + 1);
  const random2 = generateDeterministicRandom(index + 2);
  const random3 = generateDeterministicRandom(index + 3);
  const random4 = generateDeterministicRandom(index + 4);

  const baseSalary = 3000 + random1 * 5000; // 3000 - 8000
  const overtimeHours = Math.floor(random2 * 40); // 0 - 39
  const bonus = random3 * 1500; // 0 - 1500
  const discounts = random4 * 500; // 0 - 500
  const dependents = Math.floor(random1 * 4); // 0 - 3

  return { baseSalary, overtimeHours, bonus, discounts, dependents };
}

function calculatePayrollEntry(employeeId, period) {
  const data = buildEmployeeData(employeeId);
  const grossSalary = Number(
    calculateGrossSalary(data).toFixed(2)
  );
  const inss = calculateInss(grossSalary);
  const incomeTax = calculateIncomeTax(grossSalary, inss, data.dependents);
  const netSalary = Number((grossSalary - inss - incomeTax).toFixed(2));

  return {
    employeeId,
    period,
    grossSalary,
    inss,
    incomeTax,
    netSalary
  };
}

function calculatePayroll({ period = "2025-08", count = 1000 }) {
  const safeCount = Number.isInteger(count) && count > 0 ? count : 1000;
  const entries = [];

  for (let i = 1; i <= safeCount; i += 1) {
    entries.push(calculatePayrollEntry(i, period));
  }

  return entries;
}

module.exports = {
  calculatePayroll
};
