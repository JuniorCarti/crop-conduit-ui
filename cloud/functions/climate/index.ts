/**
 * Climate Cloud Functions
 * - getClimateForecast callable
 * - computeFrostRisk helper
 * - scheduleAlerts (hourly)
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { fetchForecast, type ProviderDailyForecast } from "./weatherProvider";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

type FrostSeverity = "Low" | "Medium" | "High";

const computeSeverity = (minTempC: number, windSpeed: number): FrostSeverity => {
  if (minTempC <= 2 && windSpeed <= 2.5) return "High";
  if (minTempC >= 3 && minTempC <= 5) return "Medium";
  return "Low";
};

export function computeFrostRisk(daily: ProviderDailyForecast[]) {
  const tonight = daily[0];
  const severity = tonight ? computeSeverity(tonight.minTempC, tonight.windSpeed) : "Low";

  const tips =
    severity === "High"
      ? ["Cover crops overnight", "Irrigate lightly before dusk"]
      : severity === "Medium"
      ? ["Use mulch to retain heat", "Monitor low-lying areas"]
      : [];

  return {
    severity,
    tonight: {
      minTempC: tonight?.minTempC ?? 0,
      windSpeed: tonight?.windSpeed ?? 0,
      humidity: tonight?.humidity ?? 0,
    },
    next72h: daily.slice(0, 3).map((day) => ({
      date: day.date,
      minTempC: day.minTempC,
      severity: computeSeverity(day.minTempC, day.windSpeed),
    })),
    tips,
  };
}

const buildRainSummary = (daily: ProviderDailyForecast[]) => {
  const next7Days = daily.slice(0, 7).map((day) => ({
    date: day.date,
    rainMm: day.rainMm,
    probability: day.rainChance,
  }));
  const next14Days = daily.slice(0, 14).map((day) => ({
    date: day.date,
    rainMm: day.rainMm,
    probability: day.rainChance,
  }));

  const plantingWindow = next14Days.find((day) => day.probability <= 40 && day.rainMm <= 5);

  return {
    next7Days,
    next14Days,
    plantingWindow: plantingWindow
      ? { start: plantingWindow.date, end: plantingWindow.date }
      : null,
  };
};

export const getClimateForecast = functions.region("us-central1").https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { farmId } = data;
  if (!farmId) {
    throw new functions.https.HttpsError("invalid-argument", "farmId is required");
  }

  const farmSnap = await db.collection("farms").doc(farmId).get();
  if (!farmSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Farm not found");
  }

  const farm = farmSnap.data();
  if (farm?.uid !== context.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "Unauthorized");
  }

  const forecast = await fetchForecast(farm.lat, farm.lon);
  const frostRisk = computeFrostRisk(forecast.daily);
  const rainSummary = buildRainSummary(forecast.daily);

  const todayKey = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const cacheId = `${farmId}_${todayKey}`;

  await db.collection("climateCache").doc(cacheId).set(
    {
      uid: context.auth.uid,
      farmId,
      dailyForecast: forecast.daily,
      frostRisk,
      rainSummary,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const lastUpdated = new Date().toISOString();

  return {
    farmId,
    dailyForecast: forecast.daily,
    frostRisk,
    rainSummary,
    updatedAt: lastUpdated,
    lastUpdated,
  };
});

export const scheduleAlerts = functions.pubsub.schedule("every 60 minutes").onRun(async () => {
  const subscriptionsSnap = await db.collection("alertSubscriptions").get();

  for (const docSnap of subscriptionsSnap.docs) {
    const { uid, farms } = docSnap.data();
    if (!uid || !Array.isArray(farms)) continue;

    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data();
    if (userData?.plan !== "premium") continue;

    for (const farm of farms) {
      if (!farm?.farmId) continue;
      const farmSnap = await db.collection("farms").doc(farm.farmId).get();
      if (!farmSnap.exists) continue;

      const farmData = farmSnap.data();
      if (!farmData) continue;

      const forecast = await fetchForecast(farmData.lat, farmData.lon);
      const frostRisk = computeFrostRisk(forecast.daily);

      if (farm.frost && (frostRisk.severity === "High" || frostRisk.severity === "Medium")) {
        const alertRef = db.collection("alerts").doc(uid).collection("items").doc();
        await alertRef.set({
          type: "frost",
          farmId: farm.farmId,
          severity: frostRisk.severity,
          messageSw: `Hatari ya baridi: ${frostRisk.severity}`,
          messageEn: `Frost risk: ${frostRisk.severity}`,
          scheduledFor: admin.firestore.FieldValue.serverTimestamp(),
          status: "scheduled",
        });
      }

      if (farm.rain) {
        const today = forecast.daily[0];
        if (today && (today.rainChance >= 70 || today.rainMm >= 10)) {
          const alertRef = db.collection("alerts").doc(uid).collection("items").doc();
          await alertRef.set({
            type: "rain",
            farmId: farm.farmId,
            severity: today.rainChance >= 85 ? "High" : "Medium",
            messageSw: `Utabiri wa mvua: ${today.rainMm} mm (${today.rainChance}%)`,
            messageEn: `Rain forecast: ${today.rainMm} mm (${today.rainChance}%)`,
            scheduledFor: admin.firestore.FieldValue.serverTimestamp(),
            status: "scheduled",
          });
        }
      }
    }
  }

  return null;
});
