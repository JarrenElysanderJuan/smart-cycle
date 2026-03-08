import { describe, it, expect } from 'vitest';
import { mockRouteDonation } from '../src/mocks/donation-router.mock.js';
import type { DonationAlertForRouting, FoodBankCandidate } from '../src/mocks/donation-router.mock.js';

const baseAlert: DonationAlertForRouting = {
  id: 'alert-1',
  bin_latitude: 40.7128,
  bin_longitude: -74.006,
  estimated_weight_kg: 10,
  priority: 'high',
};

const foodBanks: FoodBankCandidate[] = [
  { id: 'fb-1', name: 'Near Bank', latitude: 40.72, longitude: -74.00, capacity_kg: 50, is_active: true },
  { id: 'fb-2', name: 'Far Bank', latitude: 41.0, longitude: -73.5, capacity_kg: 100, is_active: true },
  { id: 'fb-3', name: 'Inactive Bank', latitude: 40.71, longitude: -74.01, capacity_kg: 50, is_active: false },
  { id: 'fb-4', name: 'Low Capacity', latitude: 40.715, longitude: -74.005, capacity_kg: 5, is_active: true },
];

describe('mockRouteDonation', () => {
  it('filters out inactive food banks', () => {
    const result = mockRouteDonation(baseAlert, foodBanks);
    const ids = result.map((r) => r.food_bank_id);
    expect(ids).not.toContain('fb-3');
  });

  it('filters out food banks with insufficient capacity', () => {
    const result = mockRouteDonation(baseAlert, foodBanks);
    const ids = result.map((r) => r.food_bank_id);
    expect(ids).not.toContain('fb-4');
  });

  it('sorts by proximity (nearest first)', () => {
    const result = mockRouteDonation(baseAlert, foodBanks);
    expect(result[0]?.food_bank_id).toBe('fb-1'); // Near Bank
    expect(result[1]?.food_bank_id).toBe('fb-2'); // Far Bank
  });

  it('assigns sequential ranks starting from 1', () => {
    const result = mockRouteDonation(baseAlert, foodBanks);
    result.forEach((r, i) => {
      expect(r.rank).toBe(i + 1);
    });
  });

  it('limits to maxRecipients', () => {
    const result = mockRouteDonation(baseAlert, foodBanks, 1);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when no food banks qualify', () => {
    const heavyAlert = { ...baseAlert, estimated_weight_kg: 1000 };
    const result = mockRouteDonation(heavyAlert, foodBanks);
    expect(result).toHaveLength(0);
  });

  it('includes match reason with distance', () => {
    const result = mockRouteDonation(baseAlert, foodBanks);
    expect(result[0]?.match_reason).toContain('proximity (mock)');
    expect(result[0]?.match_reason).toContain('km');
  });
});
