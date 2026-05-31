import { TransactionCategory } from './types';

const RULES: Array<{
  category: TransactionCategory;
  is_business?: boolean;
  is_reimbursable?: boolean;
  keywords: string[];
}> = [
  { category: 'salary', keywords: ['PARTNER FEE', 'SALARY', 'PAY-00', 'DIRECTOR FEE', 'AGA VENTURES'] },
  { category: 'reimbursement', keywords: ['REIMB-', 'EXPENSES CLAIM'] },
  { category: 'transfer_in', keywords: ['DUITNOW_RECEI', 'RECEIVE FROM WALLET', 'IBK FUND TFR TO', 'FUND TRANSFER TO'] },
  { category: 'car_loan', keywords: ['CAR AMF', 'AMF1800', 'HIRE PURCHASE'] },
  { category: 'utilities', keywords: ['TNB', 'TENAGA NASIONAL', 'AIR SELANGOR', 'PENGURUSAN AIR'] },
  { category: 'phone_internet', keywords: ['MAXIS', 'CELCOM', 'DIGI', 'UNIFI', 'BROADBAND'] },
  { category: 'insurance', keywords: ['PROTECT MAX', 'TAKAFUL', 'INSURANCE', 'PRUDENTIAL', 'AIA'] },
  { category: 'petrol', keywords: ['PETRONAS', 'SHELL', 'PETRON', 'BHP PETROL', 'CALTEX'] },
  { category: 'toll', keywords: ['INTERCHANGE', 'BESRAYA', 'KESAS', 'PUCHONG SELATAN', 'PAYDIRECT', 'TNGOW3'] },
  { category: 'car_maintenance', keywords: ['TAYAR', 'TYRE', 'G TAYAR', 'WORKSHOP'] },
  { category: 'food_dining', keywords: ['RESTAURANT', 'BISTRO', 'CAFE', 'ZUS COFFEE', 'MCDONALD', 'KFC', 'HOT POT', 'HAI DI LAO', 'DTF', 'SMOKE', 'EP1', 'BILALL', 'MAMAK', 'WAROENG'] },
  { category: 'groceries', keywords: ['KK SUPER', 'KK MART', 'AEON', 'GIANT', 'TESCO', 'NSK', 'ECONSAVE'] },
  { category: 'shopping', keywords: ['UNIQLO', 'ZARA', 'WATSON', 'GUARDIAN', 'SEPHORA', 'PADINI', 'VANS'] },
  { category: 'beauty_wellness', keywords: ['HAPPY HARMONY', 'BEAUTY', 'SPA', 'SALON', 'WELLNESS', 'NAIL'] },
  { category: 'travel_hotel', keywords: ['HOTEL', 'BOOKING.COM', 'BKG*', 'AIRBNB', 'AGODA', 'SHERATON', 'AIRASIA', 'KLIA'] },
  { category: 'medical_vet', keywords: ['CLINIC', 'HOSPITAL', 'PHARMACY', 'FARMASI', 'OHANA VET'] },
  { category: 'education_training', keywords: ['INSTITUT KEUSAHA', 'ULTIMAX', 'TRAINING', 'COURSE', 'EDUCATION'] },
  { category: 'saas_tools', is_business: true, is_reimbursable: true, keywords: ['FIGMA', 'AWS.AMAZON', 'ANTHROPIC', 'ZOOM.COM', 'LEMSQZY', 'LEMONSQUEEZY', 'GODADDY', 'LARK ', 'GITHUB'] },
  { category: 'road_tax', keywords: ['JABATAN PENGANGKUTAN', 'JPJ', 'ROAD TAX'] },
  { category: 'government_fees', keywords: ['JABATAN SIASATAN', 'PDRM', 'MYEG', 'COMPOUND', 'LHDN'] },
  { category: 'transfer_out', keywords: ['IBK FUND TFR FR', 'DUITNOW_TRANS', 'TRANSFER TO WALLET'] }
];

export function categorise(description: string) {
  const normalized = description.toUpperCase();
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return {
        category: rule.category,
        is_business: rule.is_business ?? false,
        is_reimbursable: rule.is_reimbursable ?? false
      };
    }
  }
  return { category: 'uncategorised' as TransactionCategory, is_business: false, is_reimbursable: false };
}
