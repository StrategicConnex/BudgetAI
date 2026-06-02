-- F12: Budget versions table
CREATE TABLE IF NOT EXISTS budget_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  changed_fields TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_budget_versions_budget_id ON budget_versions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_versions_version ON budget_versions(budget_id, version DESC);

ALTER TABLE budget_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their budget versions" ON budget_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM budgets WHERE budgets.id = budget_versions.budget_id AND budgets.user_id = auth.uid())
  );

CREATE POLICY "Users can insert budget versions" ON budget_versions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM budgets WHERE budgets.id = budget_versions.budget_id AND budgets.user_id = auth.uid())
  );
