-- Normalize legacy review rows so next_review only exists for real SRS schedule rows.
-- This removes stale "today" timestamps that were previously stored for new/learning/mastered rows.
UPDATE public.reviews
SET
  next_review = NULL,
  interval = NULL,
  updated_at = timezone('utc'::text, now())
WHERE status IN ('new', 'learning', 'lv0', 'lv1', 'mastered', 'lv5')
  AND next_review IS NOT NULL;
