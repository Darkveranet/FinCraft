const T = { STRING: 'String', TEXT: 'Text', NUMBER: 'Number', DECIMAL: 'Decimal', DATE: 'Date', BOOLEAN: 'Boolean' };

export const TREASURY_DATATABLES = [
  {
    datatableName: 'dt_teller_operational_events',
    apptableName: 'm_office',
    multiRow: true,
    columns: [
      { name: 'teller_id',                 type: T.NUMBER,  mandatory: true },
      { name: 'cashier_id',                type: T.NUMBER,  mandatory: true },
      { name: 'staff_id',                  type: T.NUMBER,  mandatory: false },
      { name: 'transaction_type',          type: T.STRING,  length: 40, mandatory: true },
      { name: 'direction',                 type: T.STRING,  length: 10, mandatory: true },
      { name: 'amount',                    type: T.DECIMAL, mandatory: true },
      { name: 'currency_code',             type: T.STRING,  length: 3,  mandatory: true },
      { name: 'transaction_date',          type: T.DATE,    mandatory: true },
      { name: 'fineract_entity_type',      type: T.STRING,  length: 40,  mandatory: false },
      { name: 'fineract_entity_id',        type: T.NUMBER,  mandatory: false },
      { name: 'fineract_transaction_id',   type: T.STRING,  length: 40,  mandatory: false },
      { name: 'narration',                 type: T.TEXT,    mandatory: false },
      { name: 'status',                    type: T.STRING,  length: 20, mandatory: true },
      { name: 'created_by',                type: T.STRING,  length: 100, mandatory: false },
      { name: 'reversed',                  type: T.BOOLEAN, mandatory: false },
      { name: 'reversal_reference',        type: T.STRING,  length: 40, mandatory: false }
    ]
  },
  {
    datatableName: 'dt_expense_requests',
    apptableName: 'm_office',
    multiRow: true,
    columns: [
      { name: 'expense_category',          type: T.STRING,  length: 60, mandatory: true },
      { name: 'expense_gl_account_id',     type: T.NUMBER,  mandatory: true },
      { name: 'amount',                    type: T.DECIMAL, mandatory: true },
      { name: 'currency_code',             type: T.STRING,  length: 3, mandatory: true },
      { name: 'narration',                 type: T.TEXT,    mandatory: false },
      { name: 'requested_by',              type: T.STRING,  length: 100, mandatory: true },
      { name: 'receipt_url',               type: T.STRING,  length: 255, mandatory: false },
      { name: 'status',                    type: T.STRING,  length: 20, mandatory: true },
      { name: 'approved_by',               type: T.STRING,  length: 100, mandatory: false },
      { name: 'payment_source',            type: T.STRING,  length: 20, mandatory: false },
      { name: 'teller_id',                 type: T.NUMBER,  mandatory: false },
      { name: 'cashier_id',                type: T.NUMBER,  mandatory: false },
      { name: 'bank_gl_account_id',        type: T.NUMBER,  mandatory: false },
      { name: 'fineract_je_transaction_id',type: T.STRING,  length: 40, mandatory: false },
      { name: 'paid_date',                 type: T.DATE,    mandatory: false }
    ]
  },
  {
    datatableName: 'dt_expense_approvals',
    apptableName: 'm_office',
    multiRow: true,
    columns: [
      { name: 'expense_row_id',            type: T.NUMBER,  mandatory: true },
      { name: 'action',                    type: T.STRING,  length: 20, mandatory: true },
      { name: 'approver',                  type: T.STRING,  length: 100, mandatory: true },
      { name: 'reason',                    type: T.TEXT,    mandatory: false },
      { name: 'action_date',               type: T.DATE,    mandatory: true }
    ]
  },
  {
    datatableName: 'dt_office_borrowings',
    apptableName: 'm_office',
    multiRow: true,
    columns: [
      { name: 'lender_name',               type: T.STRING,  length: 100, mandatory: true },
      { name: 'lender_type',               type: T.STRING,  length: 40, mandatory: false },
      { name: 'principal_amount',          type: T.DECIMAL, mandatory: true },
      { name: 'outstanding_principal',     type: T.DECIMAL, mandatory: true },
      { name: 'interest_rate',             type: T.DECIMAL, mandatory: true },
      { name: 'interest_method',           type: T.STRING,  length: 20, mandatory: true },
      { name: 'start_date',                type: T.DATE,    mandatory: true },
      { name: 'tenor_months',              type: T.NUMBER,  mandatory: true },
      { name: 'repayment_frequency',       type: T.STRING,  length: 20, mandatory: true },
      { name: 'borrowings_liability_gl_account_id', type: T.NUMBER, mandatory: false },
      { name: 'status',                    type: T.STRING,  length: 20, mandatory: true },
      { name: 'fineract_je_transaction_id',type: T.STRING,  length: 40, mandatory: false }
    ]
  },
  {
    datatableName: 'dt_office_borrowing_schedule',
    apptableName: 'm_office',
    multiRow: true,
    columns: [
      { name: 'borrowing_row_id',          type: T.NUMBER,  mandatory: true },
      { name: 'installment_no',            type: T.NUMBER,  mandatory: true },
      { name: 'due_date',                  type: T.DATE,    mandatory: true },
      { name: 'principal_due',             type: T.DECIMAL, mandatory: true },
      { name: 'interest_due',              type: T.DECIMAL, mandatory: true },
      { name: 'principal_paid',            type: T.DECIMAL, mandatory: false },
      { name: 'interest_paid',             type: T.DECIMAL, mandatory: false },
      { name: 'status',                    type: T.STRING,  length: 20, mandatory: true }
    ]
  },
  {
    datatableName: 'dt_office_borrowing_txns',
    apptableName: 'm_office',
    multiRow: true,
    columns: [
      { name: 'borrowing_row_id',          type: T.NUMBER,  mandatory: true },
      { name: 'schedule_row_id',           type: T.NUMBER,  mandatory: false },
      { name: 'txn_type',                  type: T.STRING,  length: 20, mandatory: true },
      { name: 'amount',                    type: T.DECIMAL, mandatory: true },
      { name: 'txn_date',                  type: T.DATE,    mandatory: true },
      { name: 'fineract_je_transaction_id',type: T.STRING,  length: 40, mandatory: false }
    ]
  },
  {
    datatableName: 'dt_treasury_thresholds',
    apptableName: 'm_office',
    multiRow: false,
    columns: [
      { name: 'vault_gl_account_id',                type: T.NUMBER,  mandatory: true },
      { name: 'cash_at_tellers_gl_account_id',      type: T.NUMBER,  mandatory: true },
      { name: 'bank_gl_account_id',                 type: T.NUMBER,  mandatory: true },
      { name: 'borrowings_liability_gl_account_id', type: T.NUMBER,  mandatory: false },
      { name: 'interest_payable_gl_account_id',     type: T.NUMBER,  mandatory: false },
      { name: 'interest_expense_gl_account_id',     type: T.NUMBER,  mandatory: false },
      { name: 'reserve_buffer_amount',              type: T.DECIMAL, mandatory: true },
      { name: 'currency_code',                      type: T.STRING,  length: 3, mandatory: true },
      { name: 'shortage_gl_account_id',             type: T.NUMBER,  mandatory: false },
      { name: 'overage_gl_account_id',               type: T.NUMBER,  mandatory: false }
    ]
  },
  {
    datatableName: 'dt_daily_cash_reconciliation',
    apptableName: 'm_office',
    multiRow: true,
    columns: [
      { name: 'teller_id',                 type: T.NUMBER,  mandatory: true },
      { name: 'cashier_id',                type: T.NUMBER,  mandatory: true },
      { name: 'reconciliation_date',       type: T.DATE,    mandatory: true },
      { name: 'expected_cash',             type: T.DECIMAL, mandatory: true },
      { name: 'physical_cash',             type: T.DECIMAL, mandatory: false },
      { name: 'variance',                  type: T.DECIMAL, mandatory: false },
      { name: 'status',                    type: T.STRING,  length: 20, mandatory: true },
      { name: 'submitted_by',              type: T.STRING,  length: 100, mandatory: false },
      { name: 'approved_by',               type: T.STRING,  length: 100, mandatory: false },
      { name: 'fineract_je_transaction_id',type: T.STRING,  length: 40, mandatory: false }
    ]
  }
];

export function makeTreasuryAPI(self) {
  const specByName = new Map(TREASURY_DATATABLES.map(s => [s.datatableName, s]));
  function isMultiRow(name) {
    const spec = specByName.get(name);
    if (!spec) throw new Error(`Unknown treasury datatable "${name}"`);
    return !!spec.multiRow;
  }

  return {
    tableSpecs: TREASURY_DATATABLES,

    async ensureTreasuryDatatables() {
      const existing = await self.dataTables.list();
      const existingNames = new Set((existing || []).map(t => t.registeredTableName));
      const created = [], alreadyPresent = [], failed = [];
      for (const spec of TREASURY_DATATABLES) {
        if (existingNames.has(spec.datatableName)) { alreadyPresent.push(spec.datatableName); continue; }
        try {
          await self.dataTables.create(spec);
          created.push(spec.datatableName);
        } catch (e) {
          const msg = String(e?.detail?.defaultUserMessage || e?.message || '');
          if (/already exist|duplicate/i.test(msg)) alreadyPresent.push(spec.datatableName);
          else failed.push({ name: spec.datatableName, error: msg || e });
        }
      }
      return { created, alreadyPresent, failed };
    },

    queryRows: (datatableName, officeId) => self.dataTables.query(datatableName, officeId),

    createRow: (datatableName, officeId, body) => self.dataTables.createEntry(datatableName, officeId, body),

    getRow: (datatableName, officeId, datatableId) => {
      if (!isMultiRow(datatableName)) throw new Error(`${datatableName} is a single-row config table — use queryRows(), not getRow()`);
      return self.dataTables.getEntry(datatableName, officeId, datatableId);
    },

    updateRow: (datatableName, officeId, datatableId, body) => {
      if (!isMultiRow(datatableName)) throw new Error(`${datatableName} is a single-row config table — use updateConfig(), not updateRow()`);
      return self.dataTables.updateEntryOneToMany(datatableName, officeId, datatableId, body);
    },

    deleteRow: (datatableName, officeId, datatableId) => {
      if (!isMultiRow(datatableName)) throw new Error(`${datatableName} is a single-row config table — use deleteConfig(), not deleteRow()`);
      return self.dataTables.deleteEntry(datatableName, officeId, datatableId);
    },

    updateConfig: (datatableName, officeId, body) => {
      if (isMultiRow(datatableName)) throw new Error(`${datatableName} is one-to-many — use updateRow(), not updateConfig()`);
      return self.dataTables.update(datatableName, officeId, body);
    },

    deleteConfig: (datatableName, officeId) => {
      if (isMultiRow(datatableName)) throw new Error(`${datatableName} is one-to-many — use deleteRow(), not deleteConfig()`);
      return self.dataTables.delete(datatableName, officeId);
    }
  };
}
