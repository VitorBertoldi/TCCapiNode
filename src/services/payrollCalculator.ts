import { Decimal } from '@prisma/client/runtime/library';

const scale = (n: Decimal | number | string) =>
  new Decimal(n).toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN);

const hourlyRate = (baseSalary: Decimal) =>
  scale(new Decimal(baseSalary).div(220));

const calcINSS = (gross: Decimal) => {
  // Exemplo simples: 11% com teto fictício 750
  const v = new Decimal(gross).mul(0.11);
  return scale(Decimal.min(v, new Decimal(750)));
};

const calcIRRF = (baseAfterINSS: Decimal, dependents: number) => {
  const depDed = new Decimal(189.59).mul(dependents);
  const taxable = Decimal.max(new Decimal(baseAfterINSS).sub(depDed), new Decimal(0));
  if (taxable.lte(2500)) return scale(0);
  return scale(taxable.sub(2500).mul(0.075));
};

export function computePayroll(params: {
  baseSalary: Decimal,
  dependents: number,
  overtimeHours: Decimal,
  bonus: Decimal,
  discounts: Decimal
}) {
  const base = new Decimal(params.baseSalary);
  const overtime = hourlyRate(base).mul(params.overtimeHours);
  const gross = base.add(overtime).add(params.bonus).sub(params.discounts);

  const inss = calcINSS(gross);
  const irrf = calcIRRF(gross.sub(inss), params.dependents);
  const net  = gross.sub(inss).sub(irrf);

  return {
    gross: scale(gross),
    inss: scale(inss),
    irrf: scale(irrf),
    net:  scale(net),
  };
}
