# Keeping the admin guide useful

The user-facing source of truth is [ADMIN_USER_GUIDE.md](ADMIN_USER_GUIDE.md). Developer startup instructions remain in [LOCAL_DEVELOPMENT.md](../LOCAL_DEVELOPMENT.md); architecture and requirements documents serve different purposes.

## Update alongside each feature

For every change to an admin screen, permission, billing rule, or report:

1. Update the matching task in the guide in the same change.
2. Use the exact navigation and button labels shown by the application.
3. Explain prerequisites, steps, expected result, effects on money/history, and recovery from a mistake.
4. Remove obsolete limitations and update the quick reference when appropriate.
5. Check the backend behavior as well as frontend labels. A success message alone may not describe the complete effect.
6. Walk through the affected procedure against a test deployment with synthetic records. Verify the resulting history/report, not only the success notification.
7. Update the review date and validation statement accurately. Do not call a source-reviewed procedure runtime-verified.

Do not put passwords, real customer exports, or private deployment credentials in the handbook. For screenshots, use synthetic data and include the image only when it clarifies a difficult step.

## Suggested delivery

The admin **Help / User Guide** page at `/admin/help` renders `docs/ADMIN_USER_GUIDE.md` directly through Vite's raw import. Edit this file to update both the handbook and in-app content; rebuild the frontend to include changes in the deployed app. The Docker frontend stage also copies this source. Keep one maintained source rather than editing separate copies independently. A printable PDF can be generated from the same edition when needed.

Level-two headings become searchable topics and navigation anchors; keep their titles unique. The Markdown Contents section is replaced by in-app topic navigation. Preserve existing headings when possible so bookmarked topic links remain valid.

Suggested release checklist:

- [ ] Changed admin workflows documented, or explicitly marked as having no user-facing change.
- [ ] Preconditions, exact labels, results, and irreversible effects checked.
- [ ] Examples use synthetic records.
- [ ] Affected procedures verified in the release build.
- [ ] Review date and validation scope updated.
- [ ] Any distributed copy regenerated from the maintained guide.

## Source references for the initial edition

| Subject | Primary implementation |
|---|---|
| Navigation and role routes | `frontend/src/components/AdminLayout.jsx`, `frontend/src/App.jsx` |
| Login and session behavior | `frontend/src/pages/Login.jsx`, `frontend/src/context/AuthContext.jsx`, `AuthService.java` |
| Customer enrollment and actions | `frontend/src/pages/admin/CustomerForm.jsx`, `CustomerDetail.jsx`, `CustomerService.java` |
| Payment recording | `CustomerDetail.jsx`, `PaymentService.java` |
| Hierarchy, assignment, address, packs | `Organisation.jsx`, `CustomerAddress.jsx`, `SubscriptionPacks.jsx`, their corresponding services |
| Dashboard and scheduled processing | `Dashboard.jsx`, `scheduler/BillingScheduler.java` |
| Reports and exports | `Reports.jsx`, `ReportService.java` |
| Profile | `AdminProfile.jsx`, `AdminService.java` |

Backend services are under `src/main/java/com/mecscable/billing/service/`. Admin pages are under `frontend/src/pages/admin/`.

## Behaviors requiring attention before polished user training

The initial source review found these documentation-relevant issues; they were not fixed as part of writing the guide:

- Close Account resolves statuses without creating payment transactions. Its no-outstanding branch defaults to suspension, including for already-paid accounts.
- Deactivate Subscription does create a payment transaction when payment-collected is selected. Account suspension depends on other subscriptions, including historical Paid records.
- Employee backend support and admin management exist, but frontend employee routes are absent; Login sends non-customers to the admin route, which rejects employees.
- Payment manual override is hidden when there are no packs.
- Date-range report filtering requires both From and To; changing filter controls without rerunning can make displayed rows differ from exports.
- Customer reports use current customer information; proposed historical snapshots and hierarchy filters are absent.
- The re-enrollment default date uses UTC, and some payment year controls use the browser's local year. Verify date-boundary behavior for users outside IST.

Use these as follow-up review items, not claims that end-to-end testing has confirmed every affected scenario.
