import { DashboardPayload, Debt, Transaction } from './types';

export const PREVIEW_DEBTS: Debt[] = [
  {
    id: 'aircond',
    creditor: 'Aircond',
    description: 'Aircond purchase/installation',
    original_amount: 2100,
    paid_amount: 600,
    remaining_amount: 1500,
    type: 'personal',
    priority: 1,
    target_clear_date: '2026-07-31',
    status: 'active',
    notes: 'Clear Jun-Jul 2026',
    created_at: '2026-05-01T00:00:00.000Z',
    cleared_at: null
  },
  {
    id: 'winny',
    creditor: 'Winny',
    description: 'GF - Bali + misc',
    original_amount: 2800,
    paid_amount: 0,
    remaining_amount: 2800,
    type: 'personal',
    priority: 2,
    target_clear_date: '2026-08-31',
    status: 'active',
    notes: 'Clear Aug 2026',
    created_at: '2026-05-01T00:00:00.000Z',
    cleared_at: null
  },
  {
    id: 'aws',
    creditor: 'AWS',
    description: 'AWS infra - AGA business cost',
    original_amount: 5800,
    paid_amount: 1200,
    remaining_amount: 4600,
    type: 'business',
    priority: 1,
    target_clear_date: '2026-08-31',
    status: 'active',
    notes: 'AGA pays from next milestone',
    created_at: '2026-05-01T00:00:00.000Z',
    cleared_at: null
  },
  {
    id: 'mwind-yuki',
    creditor: 'Mwind/Yuki',
    description: 'Finance outsource - AGA liability',
    original_amount: 16000,
    paid_amount: 3500,
    remaining_amount: 12500,
    type: 'business',
    priority: 2,
    target_clear_date: null,
    status: 'active',
    notes: 'Clear from AGA revenue only',
    created_at: '2026-05-01T00:00:00.000Z',
    cleared_at: null
  }
];

export const PREVIEW_DASHBOARD: DashboardPayload = {
  current_month: {
    month: '2026-05',
    salary_income: 5000,
    reimbursements_in: 680,
    total_in: 5680,
    total_out: 4214,
    business_costs: 960,
    personal_costs: 3254,
    debt_payments: 850,
    transaction_count: 58
  },
  last_6_months: [
    { month: '2025-12', salary_income: 5000, reimbursements_in: 0, total_in: 5000, total_out: 3900, business_costs: 780, personal_costs: 3120, debt_payments: 500, transaction_count: 44 },
    { month: '2026-01', salary_income: 5000, reimbursements_in: 280, total_in: 5280, total_out: 4420, business_costs: 1100, personal_costs: 3320, debt_payments: 600, transaction_count: 51 },
    { month: '2026-02', salary_income: 5000, reimbursements_in: 420, total_in: 5420, total_out: 3760, business_costs: 880, personal_costs: 2880, debt_payments: 700, transaction_count: 47 },
    { month: '2026-03', salary_income: 5000, reimbursements_in: 360, total_in: 5360, total_out: 4680, business_costs: 1240, personal_costs: 3440, debt_payments: 650, transaction_count: 62 },
    { month: '2026-04', salary_income: 5000, reimbursements_in: 540, total_in: 5540, total_out: 4020, business_costs: 1010, personal_costs: 3010, debt_payments: 750, transaction_count: 56 },
    { month: '2026-05', salary_income: 5000, reimbursements_in: 680, total_in: 5680, total_out: 4214, business_costs: 960, personal_costs: 3254, debt_payments: 850, transaction_count: 58 }
  ],
  category_breakdown: [
    { month: '2026-05', category: 'food_dining', total_spent: 682, transaction_count: 19 },
    { month: '2026-05', category: 'car_loan', total_spent: 650, transaction_count: 1 },
    { month: '2026-05', category: 'relationship', total_spent: 460, transaction_count: 6 },
    { month: '2026-05', category: 'petrol', total_spent: 188, transaction_count: 4 },
    { month: '2026-05', category: 'phone_internet', total_spent: 130, transaction_count: 1 },
    { month: '2026-05', category: 'utilities', total_spent: 196, transaction_count: 2 }
  ],
  active_debts: PREVIEW_DEBTS,
  budgets: [
    { id: 'b-food', month: '2026-05', category: 'food_dining', budgeted_amount: 700, notes: 'Hard cap' },
    { id: 'b-car', month: '2026-05', category: 'car_loan', budgeted_amount: 650, notes: 'AMF1800 Myvi fixed' },
    { id: 'b-phone', month: '2026-05', category: 'phone_internet', budgeted_amount: 130, notes: 'Personal Maxis only' },
    { id: 'b-utilities', month: '2026-05', category: 'utilities', budgeted_amount: 196, notes: 'TNB + Air Selangor' },
    { id: 'b-petrol', month: '2026-05', category: 'petrol', budgeted_amount: 115, notes: '4-month average' },
    { id: 'b-relationship', month: '2026-05', category: 'relationship', budgeted_amount: 300, notes: 'Winny + dates hard cap' },
    { id: 'b-shopping', month: '2026-05', category: 'shopping', budgeted_amount: 0, notes: 'PAUSED' }
  ]
};

export const PREVIEW_TRANSACTIONS: Transaction[] = [
  { id: 't1', account_id: 'a1', account: { name: 'Maybank Personal', institution: 'Maybank' }, date: '2026-05-28', description: 'PARTNER FEE AGA VENTURES', amount: 5000, direction: 'in', category: 'salary', is_business: false, is_reimbursable: false, reimbursed: false, source_file: 'preview.pdf', month: '2026-05', notes: null, created_at: '2026-05-28T00:00:00.000Z' },
  { id: 't2', account_id: 'a1', account: { name: 'Maybank Personal', institution: 'Maybank' }, date: '2026-05-27', description: 'CAR AMF1800 MONTHLY PAYMENT', amount: 650, direction: 'out', category: 'car_loan', is_business: false, is_reimbursable: false, reimbursed: false, source_file: 'preview.pdf', month: '2026-05', notes: null, created_at: '2026-05-27T00:00:00.000Z' },
  { id: 't3', account_id: 'a1', account: { name: 'Maybank Personal', institution: 'Maybank' }, date: '2026-05-25', description: 'ZUS COFFEE PUCHONG', amount: 18.8, direction: 'out', category: 'food_dining', is_business: false, is_reimbursable: false, reimbursed: false, source_file: 'preview.pdf', month: '2026-05', notes: null, created_at: '2026-05-25T00:00:00.000Z' },
  { id: 't4', account_id: 'a1', account: { name: 'Maybank Personal', institution: 'Maybank' }, date: '2026-05-22', description: 'AWS.AMAZON WEB SERVICES', amount: 580, direction: 'out', category: 'saas_tools', is_business: true, is_reimbursable: true, reimbursed: false, source_file: 'preview.pdf', month: '2026-05', notes: 'AGA infra', created_at: '2026-05-22T00:00:00.000Z' },
  { id: 't5', account_id: 'a1', account: { name: 'TnG eWallet', institution: 'TnG' }, date: '2026-05-21', description: 'KESAS PAYDIRECT TOLL', amount: 8.5, direction: 'out', category: 'toll', is_business: false, is_reimbursable: false, reimbursed: false, source_file: 'preview.pdf', month: '2026-05', notes: null, created_at: '2026-05-21T00:00:00.000Z' },
  { id: 't6', account_id: 'a1', account: { name: 'Maybank Personal', institution: 'Maybank' }, date: '2026-05-20', description: 'REIMB-AGA CLAIM MAY', amount: 680, direction: 'in', category: 'reimbursement', is_business: false, is_reimbursable: false, reimbursed: false, source_file: 'preview.pdf', month: '2026-05', notes: null, created_at: '2026-05-20T00:00:00.000Z' }
];
