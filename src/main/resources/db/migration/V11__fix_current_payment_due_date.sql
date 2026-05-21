-- Repair rows where an earlier version of PaymentService advanced current_payment_due_date
-- to the NEXT subscription's start date after recording a payment, while leaving
-- current_subscription_start on the paid month. The two should always agree.
UPDATE customers
   SET current_payment_due_date = current_subscription_start
 WHERE current_subscription_start IS NOT NULL
   AND current_payment_due_date IS DISTINCT FROM current_subscription_start;
