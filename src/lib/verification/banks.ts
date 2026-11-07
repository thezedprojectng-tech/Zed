export interface BankOption {
  code: string;
  name: string;
}

export const NIGERIAN_BANKS: readonly BankOption[] = [
  { code: "044", name: "Access Bank" },
  { code: "058", name: "Guaranty Trust Bank (GTBank)" },
  { code: "057", name: "Zenith Bank" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "214", name: "First City Monument Bank (FCMB)" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "232", name: "Sterling Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "999992", name: "OPay" },
  { code: "999991", name: "PalmPay" },
  { code: "50211", name: "Kuda Bank" },
  { code: "50515", name: "Moniepoint MFB" },
] as const;

export const VALID_BANK_CODES = NIGERIAN_BANKS.map((b) => b.code) as [string, ...string[]];

export function getBankName(code: string): string | undefined {
  return NIGERIAN_BANKS.find((b) => b.code === code)?.name;
}

export function isValidBankCode(code: string): boolean {
  return NIGERIAN_BANKS.some((b) => b.code === code);
}

