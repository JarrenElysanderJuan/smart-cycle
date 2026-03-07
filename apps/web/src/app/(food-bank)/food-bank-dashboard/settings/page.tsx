/**
 * Food Bank Settings Page
 *
 * View/edit food bank details.
 * TODO: [AUTH0] Fetch food bank data using the authenticated user's food_bank_id.
 */
export default function FoodBankSettingsPage(): React.ReactElement {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Food Bank Settings</h1>
      <p className="text-[var(--color-text-muted)] text-sm mb-8">Manage your food bank information</p>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-[var(--color-text-muted)]">
          Food bank settings will be available once Auth0 authentication is integrated.
          This page will allow editing capacity, accepted food types, dietary restrictions,
          pickup capability, and service area.
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-4">
          TODO: [AUTH0] Load food bank profile from PATCH /api/v1/food-banks/:foodBankId
        </p>
      </div>
    </div>
  );
}
