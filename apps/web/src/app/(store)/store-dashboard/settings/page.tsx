/**
 * Store Settings Page
 *
 * View/edit store details.
 * TODO: [AUTH0] Fetch store data using the authenticated user's store_id.
 */
export default function StoreSettingsPage(): React.ReactElement {
  return (
    <div className="fade-in">
      <h1 className="font-[family-name:var(--font-display)] text-3xl mb-1">Store Settings</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Manage your store information</p>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-[var(--color-text-muted)]">
          Store settings will be available once Auth0 authentication is integrated.
          This page will allow you to edit store name, address, contact details, and operating hours.
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-4">
          TODO: [AUTH0] Load store profile from PATCH /api/v1/stores/:storeId
        </p>
      </div>
    </div>
  );
}
