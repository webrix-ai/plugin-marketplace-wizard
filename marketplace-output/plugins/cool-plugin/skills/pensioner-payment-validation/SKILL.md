---
name: pensioner-payment-validation
description: Validate monthly payment runs for ~1M policyholders. Cross-checks mortality notifications, bank details, and payment schedules.
---

Instructions: Check mortality notifications against payment list, validate 
bank details haven't changed, flag anomalies for review.

Required Tools: PaymentSchedule, MortalityFeeds, BankingDetails, AnomalyDetection
Access Level:
  - Operations: Run validation, flag issues
  - Finance: Review and approve payment runs
  - Audit: Read-only access to payment history
Monthly Volume: ~1M payments, £XXM total
Error Detection: Auto-flags duplicate payments, deceased payees, invalid bank details
Approval: Finance Director approval for any batch >£50M
