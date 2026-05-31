CREATE SCHEMA IF NOT EXISTS personal_finance;

CREATE TABLE personal_finance.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank','ewallet','credit_card','loan','other')),
  institution TEXT NOT NULL,
  account_number TEXT,
  is_personal BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'MYR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO personal_finance.accounts (name, type, institution, account_number, is_personal) VALUES
  ('Maybank Personal', 'bank', 'Maybank', '6408', true),
  ('Maybank Business', 'bank', 'Maybank', NULL, false),
  ('Public Bank', 'bank', 'Public Bank', NULL, true),
  ('TnG eWallet', 'ewallet', 'TnG', NULL, true),
  ('Maxis', 'other', 'Maxis', NULL, true),
  ('Public Bank Car Loan', 'loan', 'Public Bank', NULL, true);

CREATE TABLE personal_finance.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES personal_finance.accounts(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  category TEXT NOT NULL DEFAULT 'uncategorised' CHECK (category IN (
    'salary','reimbursement','transfer_in',
    'car_loan','utilities','phone_internet','petrol','toll',
    'food_dining','groceries','shopping','beauty_wellness','travel_hotel',
    'insurance','road_tax','car_maintenance','medical_vet','education_training',
    'saas_tools','business_expense','debt_payment',
    'family_support','relationship','entertainment','government_fees',
    'transfer_out','uncategorised'
  )),
  is_business BOOLEAN DEFAULT false,
  is_reimbursable BOOLEAN DEFAULT false,
  reimbursed BOOLEAN DEFAULT false,
  source_file TEXT,
  month TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION personal_finance.set_transaction_month()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.month := to_char(NEW.date, 'YYYY-MM');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_transaction_month_before_write
BEFORE INSERT OR UPDATE OF date ON personal_finance.transactions
FOR EACH ROW
EXECUTE FUNCTION personal_finance.set_transaction_month();

CREATE INDEX idx_txn_month ON personal_finance.transactions(month);
CREATE INDEX idx_txn_account ON personal_finance.transactions(account_id);
CREATE INDEX idx_txn_category ON personal_finance.transactions(category);
CREATE INDEX idx_txn_date ON personal_finance.transactions(date);

CREATE TABLE personal_finance.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creditor TEXT NOT NULL,
  description TEXT,
  original_amount NUMERIC(12,2) NOT NULL,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  remaining_amount NUMERIC(12,2) GENERATED ALWAYS AS (original_amount - paid_amount) STORED,
  type TEXT NOT NULL CHECK (type IN ('personal','business')),
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  target_clear_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','cleared','paused')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  cleared_at TIMESTAMPTZ
);

INSERT INTO personal_finance.debts (creditor, description, original_amount, type, priority, target_clear_date, notes) VALUES
  ('Aircond', 'Aircond purchase/installation', 2100.00, 'personal', 1, '2026-07-31', 'Clear Jun-Jul 2026'),
  ('Winny', 'GF - Bali + misc', 2800.00, 'personal', 2, '2026-08-31', 'Clear Aug 2026'),
  ('Family', 'Family loan - confirm amount', 0.00, 'personal', 3, NULL, 'Update when confirmed'),
  ('AWS', 'AWS infra - AGA business cost', 5800.00, 'business', 1, '2026-08-31', 'AGA pays from next milestone'),
  ('Mwind/Yuki', 'Finance outsource - AGA liability', 16000.00, 'business', 2, NULL, 'Clear from AGA revenue only');

CREATE TABLE personal_finance.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL,
  category TEXT NOT NULL,
  budgeted_amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(month, category)
);

INSERT INTO personal_finance.budgets (month, category, budgeted_amount, notes) VALUES
  ('2026-06','car_loan',650.00,'AMF1800 Myvi fixed'),
  ('2026-06','phone_internet',130.00,'Personal Maxis only'),
  ('2026-06','utilities',196.00,'TNB 150 + Air Selangor 46'),
  ('2026-06','petrol',115.00,'4-month average'),
  ('2026-06','toll',17.00,'TnG highway average'),
  ('2026-06','food_dining',700.00,'Hard cap'),
  ('2026-06','medical_vet',80.00,'Ohana Vet routine'),
  ('2026-06','insurance',145.00,'Protect Max annual div 12'),
  ('2026-06','road_tax',125.00,'JPJ annual div 12'),
  ('2026-06','car_maintenance',50.00,'Annual buffer div 12'),
  ('2026-06','relationship',300.00,'Winny + dates hard cap'),
  ('2026-06','entertainment',100.00,'Social cap'),
  ('2026-06','shopping',0.00,'PAUSED'),
  ('2026-06','beauty_wellness',0.00,'PAUSED'),
  ('2026-06','travel_hotel',0.00,'PAUSED');

CREATE OR REPLACE VIEW personal_finance.monthly_summary
WITH (security_invoker = true) AS
SELECT
  month,
  SUM(CASE WHEN direction='in' AND category='salary' THEN amount ELSE 0 END) AS salary_income,
  SUM(CASE WHEN direction='in' AND category='reimbursement' THEN amount ELSE 0 END) AS reimbursements_in,
  SUM(CASE WHEN direction='in' THEN amount ELSE 0 END) AS total_in,
  SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS total_out,
  SUM(CASE WHEN direction='out' AND is_business=true THEN amount ELSE 0 END) AS business_costs,
  SUM(CASE WHEN direction='out' AND is_business=false THEN amount ELSE 0 END) AS personal_costs,
  SUM(CASE WHEN direction='out' AND category='debt_payment' THEN amount ELSE 0 END) AS debt_payments,
  COUNT(*) AS transaction_count
FROM personal_finance.transactions
GROUP BY month
ORDER BY month DESC;

CREATE OR REPLACE VIEW personal_finance.category_summary
WITH (security_invoker = true) AS
SELECT
  month,
  category,
  SUM(CASE WHEN direction='out' THEN amount ELSE 0 END) AS total_spent,
  COUNT(*) AS transaction_count
FROM personal_finance.transactions
GROUP BY month, category
ORDER BY month DESC, total_spent DESC;
