export type TransactionDirection = 'in' | 'out';
export type DebtType = 'personal' | 'business';
export type DebtStatus = 'active' | 'cleared' | 'paused';

export type TransactionCategory =
  | 'salary'
  | 'reimbursement'
  | 'transfer_in'
  | 'car_loan'
  | 'utilities'
  | 'phone_internet'
  | 'petrol'
  | 'toll'
  | 'food_dining'
  | 'groceries'
  | 'shopping'
  | 'beauty_wellness'
  | 'travel_hotel'
  | 'insurance'
  | 'road_tax'
  | 'car_maintenance'
  | 'medical_vet'
  | 'education_training'
  | 'saas_tools'
  | 'business_expense'
  | 'debt_payment'
  | 'family_support'
  | 'relationship'
  | 'entertainment'
  | 'government_fees'
  | 'transfer_out'
  | 'uncategorised';

export interface Account {
  id: string;
  name: string;
  type: string;
  institution: string;
  account_number: string | null;
  is_personal: boolean;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  account_id: string;
  account?: Pick<Account, 'name' | 'institution'> | null;
  date: string;
  description: string;
  amount: number;
  direction: TransactionDirection;
  category: TransactionCategory;
  is_business: boolean;
  is_reimbursable: boolean;
  reimbursed: boolean;
  source_file: string | null;
  month: string;
  notes: string | null;
  created_at: string;
}

export interface Debt {
  id: string;
  creditor: string;
  description: string | null;
  original_amount: number;
  paid_amount: number;
  remaining_amount: number;
  type: DebtType;
  priority: number;
  target_clear_date: string | null;
  status: DebtStatus;
  notes: string | null;
  created_at: string;
  cleared_at: string | null;
}

export interface Budget {
  id: string;
  month: string;
  category: TransactionCategory;
  budgeted_amount: number;
  notes: string | null;
}

export interface MonthlySummary {
  month: string;
  salary_income: number;
  reimbursements_in: number;
  total_in: number;
  total_out: number;
  business_costs: number;
  personal_costs: number;
  debt_payments: number;
  transaction_count: number;
}

export interface CategorySummary {
  month: string;
  category: TransactionCategory;
  total_spent: number;
  transaction_count: number;
}

export interface ParseResult {
  account_institution: string;
  statement_month?: string;
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    direction: TransactionDirection;
    source_file: string;
  }>;
  parse_errors: string[];
}

export interface DashboardPayload {
  current_month: MonthlySummary | null;
  last_6_months: MonthlySummary[];
  category_breakdown: CategorySummary[];
  active_debts: Debt[];
  budgets: Budget[];
}

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  salary: 'Salary',
  reimbursement: 'AGA Reimbursement',
  transfer_in: 'Transfer In',
  car_loan: 'Car Loan',
  utilities: 'Utilities',
  phone_internet: 'Phone & Internet',
  petrol: 'Petrol',
  toll: 'Toll',
  food_dining: 'Food & Dining',
  groceries: 'Groceries',
  shopping: 'Shopping',
  beauty_wellness: 'Beauty & Wellness',
  travel_hotel: 'Travel & Hotel',
  insurance: 'Insurance',
  road_tax: 'Road Tax',
  car_maintenance: 'Car Maintenance',
  medical_vet: 'Medical & Vet',
  education_training: 'Education',
  saas_tools: 'SaaS Tools',
  business_expense: 'Business (AGA)',
  debt_payment: 'Debt Payment',
  family_support: 'Family Support',
  relationship: 'Relationship',
  entertainment: 'Entertainment',
  government_fees: 'Govt Fees',
  transfer_out: 'Transfer Out',
  uncategorised: 'Other'
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as TransactionCategory[];

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  salary: '#0ecb81',
  reimbursement: '#2ebdff',
  transfer_in: '#4ade80',
  car_loan: '#fcd535',
  utilities: '#8b5cf6',
  phone_internet: '#06b6d4',
  petrol: '#fb923c',
  toll: '#f59e0b',
  food_dining: '#f97316',
  groceries: '#84cc16',
  shopping: '#ec4899',
  beauty_wellness: '#d946ef',
  travel_hotel: '#38bdf8',
  insurance: '#a78bfa',
  road_tax: '#fde047',
  car_maintenance: '#fbbf24',
  medical_vet: '#22c55e',
  education_training: '#60a5fa',
  saas_tools: '#818cf8',
  business_expense: '#c084fc',
  debt_payment: '#fcd535',
  family_support: '#f472b6',
  relationship: '#fb7185',
  entertainment: '#e879f9',
  government_fees: '#94a3b8',
  transfer_out: '#f6465d',
  uncategorised: '#707a8a'
};
