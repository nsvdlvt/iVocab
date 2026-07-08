-- Expand review storage for SRS levels and allow completed words to clear next_review.
ALTER TABLE public.reviews
  ALTER COLUMN next_review DROP NOT NULL;

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_status_check;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_status_check
  CHECK (status IN ('new', 'learning', 'mastered', 'lv0', 'lv1', 'lv2', 'lv3', 'lv4', 'lv5'));
