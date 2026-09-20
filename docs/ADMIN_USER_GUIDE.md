# MECS Cable TV — Admin User Guide

Last reviewed: 19 September 2026. Based on the current frontend and backend source. Screens and workflows have not been tested against a running deployment for this edition. A deployment running an older build may differ.

Use this handbook for everyday administration. Amounts are in Indian rupees. Billing rules use Indian Standard Time (IST). Check selected dates before saving, especially when working outside India.

## Quick reference

| I want to… | Go to… |
|---|---|
| Collect a payment | Customers → open customer → Record Payment |
| Find overdue customers | Customers → Status → Payment Pending |
| Export overdue customers | Reports → Customers → Status: Payment Pending → Run Report → Export |
| Create a customer | Customers → Add Customer |
| Correct customer information | Open customer → Edit |
| Restart a closed or suspended account | Open customer → Re-enroll; then record payment separately |
| Stop an account | Open customer → Close Account; read the payment behavior below |
| Schedule subscription deactivation | Current Subscription → Deactivate Subscription |
| Reset a customer's login | Customer Info → Reset Portal Password |
| Change an area's grace deadline | Manage Address → Areas → Edit |
| Set up employees or their areas | Manage Organisation → company → city → group → employee |
| Add or change prices | Manage Plans → Add New Pack / Edit |
| Check collected money | Reports → Payments → From + To → Run Report |
| Refresh billing statuses | Dashboard → Billing Scheduler Log → Run Billing Scheduler |
| Change my profile or password | Profile |
| Open this handbook in the app | Help / User Guide |

## Contents

- [Sign in and navigate](#sign-in-and-navigate)
- [Initial setup](#initial-setup)
- [Manage addresses](#manage-addresses)
- [Manage organisation and employees](#manage-organisation-and-employees)
- [Manage plans](#manage-plans)
- [Create and find customers](#create-and-find-customers)
- [Record a payment](#record-a-payment)
- [Understand billing statuses](#understand-billing-statuses)
- [Close, deactivate, re-enroll, or delete](#close-deactivate-re-enroll-or-delete)
- [Dashboard and billing scheduler](#dashboard-and-billing-scheduler)
- [Reports and exports](#reports-and-exports)
- [Profile and customer portal support](#profile-and-customer-portal-support)
- [Troubleshooting](#troubleshooting)
- [Daily routine](#daily-routine)
- [Current limits](#current-limits)

## Sign in and navigate

1. Open the application address provided by the operator.
2. Enter your admin email in **Phone / Email**, enter your password, and select **Sign In**. Admin authentication uses email.
3. Use the eye icon to show or hide the password.
4. Use the navigation menu to open Dashboard, Customers, Manage Address, Manage Organisation, Manage Plans, Reports, Profile, or Help / User Guide. Navigation appears at the bottom on small screens.
5. The sun/moon button changes the display theme. **Logout** ends the session.

**Help / User Guide** opens this handbook inside the admin portal. Search by a few words to show matching topics, select a topic to jump to its instructions, and use **Clear** to restore the full guide. Topic links can be bookmarked; they require admin sign-in. On small screens, wide reference tables can be scrolled horizontally.

A new login for an account invalidates its previous session. Tabs in the same browser profile share authentication; they are not separate independent logins. Logout synchronizes across those tabs. Other devices detect an invalidated session when they next communicate with the server.

The interface also logs out after approximately two hours without API activity. Reading an unchanged screen does not necessarily count as activity. After a session-expired or maintenance message, sign in again. Unsaved form entries may need to be entered again.

## Initial setup

For a new business or service location, complete these tasks in order:

1. Create the city in **Manage Address** or the global Cities panel in **Manage Organisation**.
2. Create a company in **Manage Organisation**, open it, and link the city.
3. In **Manage Address**, create areas under that city, set their grace days, and create streets under those areas.
4. If needed, open the company's city in **Manage Organisation**, create groups, add employees, and assign areas.
5. Add at least one pack in **Manage Plans**. The current payment form needs packs configured to expose both pack selection and manual override.
6. Create customers, selecting their company and address.
7. Record payments separately when money is collected.

Cities can be shared by multiple companies. Each customer is explicitly assigned to one company. A city being linked to multiple companies does not assign its customers to all those companies.

## Manage addresses

**Where:** Manage Address.

The address structure is **City → Area → Street**. Select the relevant level or parent to work with its records.

| Record | Add or edit |
|---|---|
| City | Enter the city name and save. Use Edit to correct an existing name. |
| Area | Select its city, enter an area name, and set Grace Period Day from 1 to 28. |
| Street | Select the city and area, enter the street name, and save. |

An area's grace day is a calendar day, not a number of extra days after joining. Day 10 means the 10th of the subscription's starting month. For a customer joining after that day, the deadline is the subscription start date.

Example: an April 1 subscription with grace day 10 becomes overdue after April 10. An April 15 start in that area uses April 15 as its deadline.

Changing an area's grace day affects the deadline used when the scheduler evaluates its unpaid subscriptions. Review the affected accounts after a change; already-pending subscriptions are not automatically moved back into grace.

Delete is available for address records, but linked records can prevent deletion. Read the error and resolve the relevant relationships before retrying. Renaming an existing record is usually the appropriate action for a spelling correction.

## Manage organisation and employees

**Where:** Manage Organisation.

The screen drills down through **Company → City → Group → Employee → Assigned Areas**. Use its breadcrumb navigation to move back up.

### Companies, cities, and groups

1. Use **Add Company** to create an operator.
2. Open the company and use **Link City** to select an existing global city.
3. Open the linked city and use **Add Group** to create a group for that company and city.
4. Use the record's **Edit** action to change its supported fields. Company editing includes its active setting.

Inactive companies remain available in labelled hierarchy filters, but the customer creation form lists active companies. Deactivating a company is not the customer account-closure workflow.

Company, city, and group screens also expose removal/deletion actions. Removing a city link and deleting a global city are different operations. Linked groups, employees, or other records can block removal; follow the displayed error rather than deleting customer history to clear a dependency.

### Add or edit employees

1. Open the required group.
2. Under **Add Employee**, enter first name, phone, password, and any optional last name or email.
3. Save and open the employee.
4. Use **Edit** for employee details and the active setting. Use **Reset Password** to set and confirm a new password.

The admin can manage employee records and assignments. **An employee-facing web portal is not wired into the current frontend routes.** Do not use this guide as an employee sign-in guide.

### Assign or transfer an area

1. Open the employee and select **Assign Areas**.
2. Select the available areas and save.
3. Confirm they appear in **Assigned Areas**. **View Customers** opens customers for that area.
4. To transfer an area, open its current employee, select **Remove** beside the area, and confirm. Then assign it to the new employee.

An area can be assigned to only one employee at a time. Deactivating an employee is not a substitute for explicitly removing/transferring their area assignments. Employee deletion can also be blocked by payment history.

## Manage plans

**Where:** Manage Plans. The page calls the individual plans **packs**.

1. Under **Add New Pack**, enter the pack name, monthly rate, and optional description.
2. Save and confirm it appears in **All Packs**.
3. Use **Edit** on an existing pack to change its details.

A payment can include several packs; the form adds their rates. Editing a pack is not a payment and does not rewrite historical payment amounts. Check the total again the next time you collect payment.

## Create and find customers

### Add a customer

**Where:** Customers → Add Customer.

1. Select the company.
2. Enter first name and a unique phone number. Add last name, email, UPI ID, and STB ID where applicable.
3. Select City, then Area, then optional Street; enter the door number.
4. Choose the subscription start date. If omitted, the backend uses today's IST date.
5. Enter **Monthly Rate (₹)**. This field is required in the current form.
6. Set an optional **Portal Password** if customer login is needed.
7. Save and review the customer detail page.

The application generates the customer ID. There is no field to enter a separate business customer code. Phone numbers cannot be shared by two customer records. An STB ID already assigned to an active customer is rejected during creation/editing.

The first subscription ends on the last day of its start month. Creating a customer does not record money collected. The current code does not automatically prorate the entered monthly rate for a partial month.

### Find and edit a customer

1. Open **Customers** and search by name, phone, or STB ID.
2. Narrow results by status or Company, City, Group, Employee, Area, and Street.
3. Open the customer and select **Edit** to update personal or address details.
4. When changing a parent selection, reselect the dependent address fields and save.

The selected company must serve the address's city, and a selected street must belong to the area. Changing contact details does not record a payment or re-enroll an account.

Customer detail includes **Customer Info**, **Current Subscription**, a future subscription when applicable, **Payment History**, and **Account History**. The latter shows status changes, dates, actor names when available, and notes. Some history columns are hidden on narrow screens; use a wider screen for a full review.

## Record a payment

**Where:** Customers → open customer → Record Payment.

1. Confirm the customer and account status. Closed or suspended customers must be re-enrolled first.
2. Select one or more **Packs**. Check the calculated total.
3. If an agreed amount differs, enable **Manual override (enter amount directly)** and enter a positive amount. This clears pack selections; explain the reason in Notes.
4. Select **For Month** using the month and year controls.
5. Enter the payment method and notes where needed.
6. Submit once, wait for confirmation, and verify the new row in **Payment History**.

**For Month is the subscription month, not the collection date.** For example, April dues collected in May should have For Month set to April. The server records the actual collection timestamp when you submit; the current form does not support backdating it.

The selected month must have a payable subscription. An already-paid, cancelled, or suspended subscription cannot be paid through this flow. Selecting an arbitrary month does not create a subscription for it.

A successful payment marks the selected subscription **PAID** and normally creates the following month's **SCHEDULED** subscription if one does not already exist. The new subscription carries the amount and selected packs. The current subscription can continue showing the paid month until the scheduler advances it.

This workflow treats the submitted amount as settling the subscription. It is not an installment or remaining-balance calculator. There is no admin payment edit, reversal, or refund screen; contact the maintainer if the wrong amount or month was recorded.

## Understand billing statuses

Customer account status and subscription status describe different things.

| Account status | Meaning |
|---|---|
| Active | Account is operating; payment may still be due. |
| Account Closed | Closed through the payment-collected closure branch. Re-enrollment is required to collect again. |
| Suspended | Inactive account, including closure without payment or certain subscription deactivations. Re-enrollment is required. |

| Subscription status | Meaning |
|---|---|
| Scheduled / Next Month Ready | Subscription exists for an upcoming period; this is not proof of payment. |
| Grace | Payment is due; the grace deadline has not yet been processed as overdue. |
| Payment Pending | Unpaid after the grace deadline, or newly re-enrolled awaiting payment. |
| Paid | Subscription has been resolved as paid; check Payment History for the actual collection record. |
| Suspended | Subscription stopped/suspended. |
| Cancelled | A future subscription was cancelled, such as through account closure. |

For routine monthly subscriptions, payment is due on the first day. For the initial partial month, it is due on the subscription start date. The scheduler processes overdue status after the area's deadline; it does not immediately suspend every overdue customer.

## Close, deactivate, re-enroll, or delete

These actions have different effects. Read the relevant procedure before confirming.

### Close an account

1. Open the customer and select **Close Account**.
2. If asked whether outstanding payment was collected, answer accurately and review/add notes.
3. Confirm and inspect the account status, current subscription, future subscription, and history.

With **payment collected**, the current implementation sets the account to Account Closed and resolves open current subscriptions as Paid. With **no payment collected**, it sets the account and open current subscriptions to Suspended. Future open subscriptions are cancelled.

**Close Account does not create a payment transaction.** A Paid label resulting from closure is not evidence that money was added to payment reports. If money was received, record it through Record Payment so it appears in the ledger.

Current quirk: when no outstanding-payment question is shown, the closure form submits “no payment collected,” so even closing an already-paid account can produce **Suspended**. Check the result; ask the maintainer if a specific Account Closed classification is required.

### Schedule subscription deactivation

1. In **Current Subscription**, select **Deactivate Subscription**, when offered.
2. Choose a date from today through the subscription end date.
3. For outstanding dues, choose **Yes, payment collected** or **No, write off**.
4. Enter the required reason/notes and select **Schedule Deactivation**.
5. Check the scheduled-date message and any payment entry created.

Unlike Close Account, **Yes, payment collected here creates a payment transaction immediately**, using the stored subscription rate (or fallback customer amount). It does not calculate a partial-month charge. **No, write off** records the write-off decision without recording collected money.

The scheduler applies the subscription suspension when the date is due. Choosing today does not itself execute the scheduler; run it manually if processing is needed today after the automatic run. The account-level status also depends on other subscriptions, so review it separately.

The action is unavailable for paid, cancelled, suspended, or already-scheduled-for-deactivation subscriptions, and for closed/suspended accounts. Future subscriptions are stopped through Close Account. No undo/reschedule control is exposed for a saved deactivation.

### Re-enroll a returning customer

1. Open the closed or suspended customer and select **Re-enroll**.
2. Verify **Start Date** and **Monthly Rate**; the rate defaults to the customer's existing amount.
3. Save. The account becomes Active, and the new subscription is marked Payment Pending.
4. Record payment separately for the correct month.

Re-enrollment preserves the existing customer record and history. Verify the date explicitly when outside India; the form's initial date is currently derived from UTC.

### Delete a customer

**Delete Customer** appears under Customer Info. The account must first be inactive. Deletion permanently removes the customer's payments, subscriptions, and account-status history as well as the customer record. It changes the information available to historical reports. Use account closure when you need to retain history.

## Dashboard and billing scheduler

Use the hierarchy filters to scope customer and subscription status counts. Selecting a status tile opens the customer list with the relevant filters. Clear filters to return to the overall view.

The monthly payment total cards are **aggregate totals and are not scoped by the hierarchy filters**. Use payment reports for date/area collection totals.

The billing scheduler runs daily at **3:00 a.m. IST** while the application is running. It moves due Scheduled subscriptions to Grace, moves overdue Grace subscriptions to Payment Pending, and applies scheduled deactivations.

To run it manually:

1. Open **Dashboard → Billing Scheduler Log**.
2. Select **Run Billing Scheduler** and wait for the completion message.
3. Review moved/deactivated counts and the latest log entry. Automatic runs identify SYSTEM; manual runs identify the admin email.
4. Review affected customer records if needed. Log pages let you inspect earlier runs.

Zero moves is a valid result when nothing is due. A manual run processes eligible records across the application; the dashboard's filters do not limit its scope. This action updates billing records; it is not a database backup or a connection to cable hardware.

## Reports and exports

### Payments collected during a period

1. Open **Reports → Payments**.
2. Set both **From** and **To**, then optionally select an Area.
3. Select **Run Report** and review the count, total, and rows.
4. Select **Export CSV** or **Export Excel**.

Use both dates: the current backend applies the date range only when both are supplied. Dates filter **collection timestamps**, not For Month. To review money collected in April, choose April 1–30; rows can include payments for a different subscription month.

Payment export columns: Payment ID, Payment Date, For Month, Customer ID, Customer Name, Area, Phone, Amount, Method, Recorded By, and Notes.

### Customer and pending-payment lists

1. Open **Reports → Customers**.
2. Select an optional Status and Area.
3. Select **Run Report**, then Export CSV or Export Excel.

Use **Payment Pending** for the current pending collection list; **Grace** for dues still in grace; **Account Closed** or **Suspended** for the relevant inactive records. The displayed Status column is the customer account status, so a subscription-status filter can return an Active customer.

Customer export columns: Customer ID, First Name, Last Name, Area, Door No, Street, Phone, Email, STB ID, Status, Current Amount, Last Payment Date, Subscription Start, and Subscription End.

After changing any filter, run the report again before exporting. Export links use the current filter inputs, while the displayed results are from the last run.

Customer reports show current records, not a historical “as of month” snapshot. The Reports page currently has fewer filters than Customers and Dashboard: Company, City, Group, Employee, and Street filters are not available here. City and PIN code are not included in the current customer export.

## Profile and customer portal support

**Your profile:** Open **Profile**, edit first name, last name, email, or phone, and save. Use the current admin email for future sign-ins. To change your password, enter the current password, new password, and confirmation in **Change Password**.

**Customer password:** Open the customer → **Reset Portal Password**, enter the new password, and save. This invalidates the customer's existing sessions. A password can also be set at customer creation; leaving it blank means portal credentials have not been configured.

Customers sign in with their registered phone/email and password to view their own account and history. Closed/suspended access is limited to the two-year window checked from suspension time. The customer portal is read-only; entering a UPI ID does not send a payment request or collect money automatically.

## Troubleshooting

| What you see | What to check or do |
|---|---|
| Empty company/city/area/street dropdown | Create the record first; check company-city links and select parent fields in order. |
| Phone number already registered | Search for the existing customer; update or re-enroll that record where appropriate. |
| STB ID already assigned | Check the active customer's device assignment before reusing the ID. |
| Record Payment is disabled | The account is closed/suspended. Re-enroll first. |
| No payable subscription found | Check For Month and the existing subscription. The period may be paid or absent. |
| No packs, no usable payment amount | Add a pack through Manage Plans; the current modal exposes manual override only when packs exist. |
| Payment request failed or connection dropped | Check Payment History before submitting again; the transaction might already have completed. |
| Paid label but no collected amount in reports | Check whether Close Account resolved the status without creating a payment transaction. |
| No data for report filters | Clear/narrow filters and retry. The current UI also uses this message for some rejected requests; persistent unexpected emptiness needs maintainer review. |
| Customer missing from a list | Clear search, status, and hierarchy filters; check inactive-company filtering. |
| Area unavailable for assignment | Remove it from its existing employee first. |
| Delete/remove fails | Read the relationship/dependency error; do not repeatedly submit. |
| Session expired or maintenance message | Sign in again. If the service remains unavailable, contact the maintainer. |
| Wrong payment amount/month saved | Preserve the record and contact the maintainer; no correction/reversal screen exists. |

When reporting a problem, include the screen name, customer ID if relevant, selected filters/month, exact error, IST time, and whether the action appears in history. Never include passwords.

## Daily routine

1. Check the dashboard and the latest billing scheduler log.
2. Review Payment Pending and Grace customers by area.
3. Record each collection against the correct subscription month and verify its history entry.
4. At day's end, run the payment report with both dates set to today and reconcile cash/UPI collections against it.
5. Review any closures, deactivations, or re-enrollments made that day.
6. Log out when finished.

## Current limits

The current admin screens do not provide complaint management, automatic receipt delivery, yearly billing, a separate installation-charge workflow, vacation/resume controls, or admin-triggered database backups. Employee records can be managed, but employee web navigation is incomplete. Historical monthly customer snapshots and all proposed report filters are not yet available.

The 3:00 a.m. billing job is confirmed in source; this does **not** confirm that database snapshots are installed or running. Backup verification belongs to the maintainer's operating procedure.

If the deployed screens differ from this guide, give the maintainer the screen name and requested task so the application version and documentation can be checked together.
