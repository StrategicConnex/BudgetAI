-- P8: Database indexes for performance
-- S7: Audit log table

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_user_created ON budgets(user_id, created_at DESC);

-- Audit log table (S7)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'exported', 'duplicated', 'deleted')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_budget_id ON audit_log(budget_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own audit logs" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit logs" ON audit_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
