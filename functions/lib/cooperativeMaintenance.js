"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cooperativeMaintenanceDaily = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.cooperativeMaintenanceDaily = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    // 1) Disable expired join codes
    const joinCodeGroups = await db.collectionGroup("joinCodes").get();
    const joinCodeWrites = [];
    joinCodeGroups.forEach((snap) => {
        var _a, _b, _c;
        const data = snap.data();
        const expiresAt = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.expiresAt) === null || _a === void 0 ? void 0 : _a.toMillis) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : null;
        const isExpired = expiresAt != null && expiresAt <= now.toMillis();
        if (isExpired && (data === null || data === void 0 ? void 0 : data.isActive) !== false) {
            joinCodeWrites.push(snap.ref.set({
                isActive: false,
                status: "disabled",
                updatedAt: now,
            }, { merge: true }));
        }
    });
    // 2) Expire old pending join requests (> 30 days)
    const cutoff = admin.firestore.Timestamp.fromMillis(now.toMillis() - 30 * 24 * 60 * 60 * 1000);
    const pendingRequests = await db.collection("orgJoinRequests").where("status", "==", "submitted").get();
    const requestWrites = [];
    pendingRequests.forEach((snap) => {
        var _a, _b, _c;
        const data = snap.data();
        const createdAt = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.createdAt) === null || _a === void 0 ? void 0 : _a.toMillis) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : null;
        if (createdAt != null && createdAt < cutoff.toMillis()) {
            requestWrites.push(snap.ref.set({
                status: "expired",
                expiryReason: "timeout",
                updatedAt: now,
            }, { merge: true }));
        }
    });
    await Promise.all([...joinCodeWrites, ...requestWrites]);
    return null;
});
//# sourceMappingURL=cooperativeMaintenance.js.map