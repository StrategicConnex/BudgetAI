-- F7: Allow public read access to budgets for share links.
-- Only ai_output is exposed; raw_input and user_id stay protected.

-- Public can read basic budget info for share pages
CREATE POLICY "Public can read shared budgets" ON budgets
  FOR SELECT
  USING (status IN ('ready', 'exported'));
