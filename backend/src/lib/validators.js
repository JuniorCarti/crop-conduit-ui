const PERIOD_REGEX = /^(\d{4}-(0[1-9]|1[0-2])|\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3]))$/;

function parseJsonBody(event) {
  if (!event?.body) return {};
  try {
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (cause) {
    const error = new Error('Invalid JSON body');
    error.statusCode = 400;
    error.cause = cause;
    throw error;
  }
}

function validatePeriodId(periodId) {
  if (typeof periodId !== 'string' || !PERIOD_REGEX.test(periodId)) {
    const error = new Error('periodId must match YYYY-MM or YYYY-W##');
    error.statusCode = 400;
    throw error;
  }
}

function asNonNegativeNumber(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const error = new Error(`${field} must be a non-negative number`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

function validateCoopSnapshotInput(input) {
  const requiredFields = [
    'periodId',
    'county',
    'activeMembers',
    'pendingMembers',
    'sponsoredMembers',
    'paidMembers',
    'groupSalesVolumeKg',
    'groupSalesValueKES',
    'avgFarmGatePrice',
    'trainingsHeld',
    'attendanceCount'
  ];

  for (const field of requiredFields) {
    if (input[field] === undefined || input[field] === null || input[field] === '') {
      const error = new Error(`Missing required field: ${field}`);
      error.statusCode = 400;
      throw error;
    }
  }

  validatePeriodId(input.periodId);
  if (typeof input.county !== 'string' || !input.county.trim()) {
    const error = new Error('county is required');
    error.statusCode = 400;
    throw error;
  }

  return {
    periodId: input.periodId.trim(),
    county: input.county.trim(),
    subCounty: typeof input.subCounty === 'string' ? input.subCounty.trim() : null,
    ward: typeof input.ward === 'string' ? input.ward.trim() : null,
    activeMembers: asNonNegativeNumber(input.activeMembers, 'activeMembers'),
    pendingMembers: asNonNegativeNumber(input.pendingMembers, 'pendingMembers'),
    sponsoredMembers: asNonNegativeNumber(input.sponsoredMembers, 'sponsoredMembers'),
    paidMembers: asNonNegativeNumber(input.paidMembers, 'paidMembers'),
    groupSalesVolumeKg: asNonNegativeNumber(input.groupSalesVolumeKg, 'groupSalesVolumeKg'),
    groupSalesValueKES: asNonNegativeNumber(input.groupSalesValueKES, 'groupSalesValueKES'),
    avgFarmGatePrice: asNonNegativeNumber(input.avgFarmGatePrice, 'avgFarmGatePrice'),
    trainingsHeld: asNonNegativeNumber(input.trainingsHeld, 'trainingsHeld'),
    attendanceCount: asNonNegativeNumber(input.attendanceCount, 'attendanceCount'),
    orgId: typeof input.orgId === 'string' ? input.orgId.trim() : null
  };
}

function normalizeScope(scope) {
  if (typeof scope !== 'string' || !scope.trim()) {
    const error = new Error('scope query parameter is required');
    error.statusCode = 400;
    throw error;
  }
  const normalized = scope.trim();
  if (normalized === 'NATIONAL' || normalized.startsWith('COUNTY#')) {
    return normalized;
  }
  const error = new Error('scope must be NATIONAL or COUNTY#{Name}');
  error.statusCode = 400;
  throw error;
}

function previousPeriodId(periodId) {
  if (/^\d{4}-\d{2}$/.test(periodId)) {
    const [yearText, monthText] = periodId.split('-');
    let year = Number(yearText);
    let month = Number(monthText);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  if (/^\d{4}-W\d{2}$/.test(periodId)) {
    const [yearText, weekText] = periodId.split('-W');
    let year = Number(yearText);
    let week = Number(weekText);
    week -= 1;
    if (week === 0) {
      week = 52;
      year -= 1;
    }
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  return null;
}

module.exports = {
  parseJsonBody,
  validatePeriodId,
  validateCoopSnapshotInput,
  normalizeScope,
  previousPeriodId
};

