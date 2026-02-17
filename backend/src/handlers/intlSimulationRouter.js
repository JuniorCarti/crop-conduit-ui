const { PutCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { dynamo } = require('../lib/dynamo');
const { authenticateRequest } = require('../lib/authFirebase');
const { isOrgActor, isSuperAdmin } = require('../lib/rbac');
const {
  isOptionsRequest,
  preflightResponse,
  ok,
  created,
  jsonResponse,
} = require('../lib/response');
const { parseJsonBody } = require('../lib/validators');
const { v4: uuidv4 } = require('uuid');

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const nowIso = () => new Date().toISOString();

function getMethod(event) {
  return event?.requestContext?.http?.method || event?.httpMethod || 'GET';
}

function getPath(event) {
  const path = event?.requestContext?.http?.path || event?.path || '';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

function getIntlTable() {
  const table = process.env.INTL_SIM_TABLE;
  if (!table) {
    const error = new Error('INTL_SIM_TABLE is not configured');
    error.statusCode = 500;
    throw error;
  }
  return table;
}

function assertOrgAccess(actor, orgId) {
  if (isSuperAdmin(actor)) return;
  if (!isOrgActor(actor)) {
    const error = new Error('Only cooperative admin/staff can use simulation');
    error.statusCode = 403;
    throw error;
  }
  if (!actor?.orgId || actor.orgId !== orgId) {
    const error = new Error('You can only manage scenarios for your organization');
    error.statusCode = 403;
    throw error;
  }
}

function normalizePolicyShock(value) {
  const normalized = String(value || 'none').toLowerCase();
  if (['none', 'tariff increase', 'tariff removal', 'border delays'].includes(normalized)) return normalized;
  return 'none';
}

function normalizeSeason(value) {
  const normalized = String(value || 'shoulder').toLowerCase();
  if (['in-season', 'shoulder', 'off-season'].includes(normalized)) return normalized;
  return 'shoulder';
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildSimulation(input) {
  const localPrice = parseNumber(input.localPriceKESPerKg, 0);
  if (localPrice <= 0) {
    const error = new Error('No local price available for this crop/market. Choose another market or try later.');
    error.statusCode = 400;
    throw error;
  }

  const importPressure = clamp(parseNumber(input.importPressure, 35), 0, 100);
  const fxShockPercent = clamp(parseNumber(input.fxShockPercent, 0), -10, 10);
  const policyShock = normalizePolicyShock(input.policyShock);
  const seasonFactor = normalizeSeason(input.seasonFactor);
  const horizonWeeks = [2, 4, 6].includes(Number(input.horizonWeeks)) ? Number(input.horizonWeeks) : 4;
  const shockOn = Boolean(input.importShockEvent);

  const base = localPrice;
  const importEffect = -(importPressure / 100) * 0.18 * base;
  const fxEffect = (fxShockPercent / 100) * 0.1 * base;

  const policyEffectMap = {
    'none': 0,
    'tariff increase': 0.05 * base,
    'tariff removal': -0.06 * base,
    'border delays': 0.03 * base,
  };
  const seasonEffectMap = {
    'in-season': -0.07 * base,
    'shoulder': 0,
    'off-season': 0.06 * base,
  };

  const policyEffect = policyEffectMap[policyShock] || 0;
  const seasonEffect = seasonEffectMap[seasonFactor] || 0;
  const shockEffect = shockOn ? -0.08 * base : 0;

  const mid = base + importEffect + fxEffect + policyEffect + seasonEffect + shockEffect;
  const volatility = clamp(0.12 + importPressure / 250 + (shockOn ? 0.1 : 0) + Math.abs(fxShockPercent) / 100, 0.1, 0.45);
  const min = mid * (1 - volatility);
  const max = mid * (1 + volatility);

  const direction = mid > base * 1.02 ? 'up' : mid < base * 0.98 ? 'down' : 'flat';

  const importLabel = importPressure >= 67 ? 'High' : importPressure >= 34 ? 'Medium' : 'Low';
  const confidence = localPrice > 0 ? (importPressure <= 50 && !shockOn ? 'Medium' : 'Low') : 'Low';

  const drivers = [];
  if (importPressure >= 60) drivers.push('High import pressure pushing prices down.');
  if (fxShockPercent > 1) drivers.push('KES weakening adds upward price pressure.');
  if (fxShockPercent < -1) drivers.push('KES strengthening eases local prices.');
  if (policyShock === 'tariff increase') drivers.push('Tariff increase supports local prices.');
  if (policyShock === 'tariff removal') drivers.push('Tariff removal increases import competition.');
  if (policyShock === 'border delays') drivers.push('Border delays tighten supply in the short term.');
  if (seasonFactor === 'in-season') drivers.push('In-season harvest raises supply and softens prices.');
  if (seasonFactor === 'off-season') drivers.push('Off-season supply constraints support higher prices.');
  if (shockOn) drivers.push('Import shock event increases downside volatility.');
  if (!drivers.length) drivers.push('Baseline conditions are relatively stable.');

  const recommendations = [];
  if (mid < base * 0.95) {
    recommendations.push('Hold stock if possible.');
    recommendations.push('Stagger deliveries.');
    recommendations.push('Seek contract floor price.');
  } else if (mid > base * 1.05) {
    recommendations.push('List now.');
    recommendations.push('Increase collection planning.');
  } else {
    recommendations.push('Monitor weekly.');
    recommendations.push('Sell in small batches.');
  }

  recommendations.push('Offer contract floor price for large buyers.');

  const weeks = [0, Math.max(2, Math.floor(horizonWeeks / 2)), horizonWeeks];
  const timeline = weeks.map((week) => {
    if (week === 0) {
      return {
        label: 'Week 0',
        min: Number(base.toFixed(2)),
        mid: Number(base.toFixed(2)),
        max: Number(base.toFixed(2)),
      };
    }
    const progress = week / horizonWeeks;
    const weekMid = base + (mid - base) * progress;
    const weekVol = volatility * (0.75 + progress * 0.25);
    return {
      label: `Week ${week}`,
      min: Number((weekMid * (1 - weekVol)).toFixed(2)),
      mid: Number(weekMid.toFixed(2)),
      max: Number((weekMid * (1 + weekVol)).toFixed(2)),
    };
  });

  return {
    localPriceKESPerKg: Number(base.toFixed(2)),
    projectedMin: Number(min.toFixed(2)),
    projectedMid: Number(mid.toFixed(2)),
    projectedMax: Number(max.toFixed(2)),
    direction,
    volatilityScore: Number(volatility.toFixed(4)),
    importPressure,
    importPressureLabel: importLabel,
    fxShockPercent,
    policyShock,
    seasonFactor,
    shockOn,
    horizonWeeks,
    confidence,
    drivers,
    recommendations,
    timeline,
    currency: 'KES',
  };
}

function scenarioPk(orgId) {
  return `ORG#${orgId}`;
}

function scenarioSk(createdAt, scenarioId) {
  return `SCENARIO#${createdAt}#${scenarioId}`;
}

const failure = (event, statusCode, error) =>
  jsonResponse(event, statusCode, { ok: false, error });

exports.handler = async (event) => {
  if (isOptionsRequest(event)) return preflightResponse(event);

  try {
    const actor = await authenticateRequest(event);
    const method = getMethod(event).toUpperCase();
    const path = getPath(event);
    const tableName = getIntlTable();

    const scenarioMatch = path.match(/^\/intl\/scenarios\/([^/]+)$/);

    if (method === 'POST' && path === '/intl/simulate') {
      const body = parseJsonBody(event);
      const orgId = String(body.orgId || actor.orgId || '').trim();
      if (!orgId) return failure(event, 400, 'orgId is required');
      assertOrgAccess(actor, orgId);

      const result = buildSimulation(body);
      return ok(event, { ok: true, result });
    }

    if (method === 'GET' && path === '/intl/scenarios') {
      const orgId = String(event?.queryStringParameters?.orgId || actor.orgId || '').trim();
      if (!orgId) return failure(event, 400, 'orgId is required');
      assertOrgAccess(actor, orgId);

      const response = await dynamo.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: {
            ':pk': scenarioPk(orgId),
            ':prefix': 'SCENARIO#',
          },
          ScanIndexForward: false,
          Limit: 100,
        })
      );

      return ok(event, { ok: true, items: response.Items || [] });
    }

    if (method === 'POST' && path === '/intl/scenarios') {
      const body = parseJsonBody(event);
      const orgId = String(body.orgId || actor.orgId || '').trim();
      if (!orgId) return failure(event, 400, 'orgId is required');
      assertOrgAccess(actor, orgId);

      const simulation = body.result && typeof body.result === 'object' ? body.result : buildSimulation(body);
      const scenarioId = body.scenarioId || uuidv4();
      const createdAt = nowIso();

      const item = {
        pk: scenarioPk(orgId),
        sk: scenarioSk(createdAt, scenarioId),
        orgId,
        scenarioId,
        name: String(body.name || body.scenarioName || `Scenario ${new Date().toLocaleString()}`),
        crop: String(body.crop || ''),
        market: String(body.market || ''),
        horizonWeeks: Number(body.horizonWeeks || simulation.horizonWeeks || 4),
        importPressure: Number(body.importPressure ?? simulation.importPressure ?? 35),
        fxShockPercent: Number(body.fxShockPercent ?? simulation.fxShockPercent ?? 0),
        policyShock: normalizePolicyShock(body.policyShock),
        seasonFactor: normalizeSeason(body.seasonFactor),
        importShockEvent: Boolean(body.importShockEvent),
        projectedMid: Number(simulation.projectedMid || 0),
        localPriceKESPerKg: Number(simulation.localPriceKESPerKg || 0),
        result: simulation,
        createdAt,
        createdByUid: actor.uid,
      };

      await dynamo.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );

      return created(event, { ok: true, item });
    }

    if (method === 'DELETE' && scenarioMatch) {
      const scenarioId = decodeURIComponent(scenarioMatch[1]);
      const orgId = String(event?.queryStringParameters?.orgId || actor.orgId || '').trim();
      if (!orgId) return failure(event, 400, 'orgId is required');
      assertOrgAccess(actor, orgId);

      const response = await dynamo.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: {
            ':pk': scenarioPk(orgId),
            ':prefix': 'SCENARIO#',
          },
          Limit: 100,
        })
      );

      const target = (response.Items || []).find((row) => row.scenarioId === scenarioId);
      if (!target) return failure(event, 404, 'Scenario not found');

      await dynamo.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { pk: target.pk, sk: target.sk },
        })
      );

      return ok(event, { ok: true, scenarioId });
    }

    return failure(event, 404, 'Route not found');
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    if (statusCode >= 400 && statusCode < 500) {
      return failure(event, statusCode, error.message || 'Request failed');
    }
    console.error('[intlSimulationRouter] unhandled_error', error);
    return failure(event, 500, error?.message || 'Internal Server Error');
  }
};
