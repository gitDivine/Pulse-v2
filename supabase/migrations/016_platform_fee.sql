-- Platform fee: 7% charged to shipper, on top of carrier's agreed_amount
-- platform_fee = agreed_amount * 0.07 (kobo)
-- total_amount = agreed_amount + platform_fee (kobo)

ALTER TABLE trips ADD COLUMN platform_fee BIGINT NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN total_amount BIGINT NOT NULL DEFAULT 0;

-- Backfill existing trips (pre-fee era: no fee, total = agreed)
UPDATE trips SET total_amount = agreed_amount WHERE total_amount = 0;
