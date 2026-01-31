/**
 * Harvest Module - Demo Data Seeding Script
 * 
 * Usage:
 * 1. Import this file in your component or page
 * 2. Call seedDemoData(currentUser.uid) after user logs in
 * 3. Data will be created in Firestore under users/{uid}/harvest
 * 
 * Use for:
 * - Demo/testing purposes
 * - Showing sample data to new users
 * - Development and UI testing
 * 
 * ⚠️ WARNING: This creates REAL data in Firestore
 */

import {
    createHarvestSchedule,
    createWorker,
    createDelivery,
} from "@/services/firestore-harvest";
import {
    CreateHarvestScheduleInput,
    CreateWorkerInput,
    CreateDeliveryInput,
} from "@/types/harvest";

/**
 * Seed complete demo dataset for harvest module
 * Creates 3 schedules, 4 workers, and 6 deliveries
 */
export async function seedDemoData(userId: string): Promise<void> {
    if (!userId) {
        throw new Error("User ID is required for seeding demo data");
    }

    console.log("🌱 Seeding demo data for user:", userId);

    try {
        // ========================================================================
        // CREATE DEMO SCHEDULES
        // ========================================================================

        const scheduleData: CreateHarvestScheduleInput[] = [
            {
                cropId: "crop-corn-001",
                farmId: "farm-demo",
                cropName: "Corn",
                field: "Field A (North)",
                plantedDate: new Date("2025-05-01"),
                estimatedReadyDate: new Date("2025-09-15"),
                optimalDate: "2025-09-20",
                expectedYield: 450,
                yieldUnit: "kg",
                notes: "Early season crop, good soil moisture",
            },
            {
                cropId: "crop-maize-001",
                farmId: "farm-demo",
                cropName: "Maize",
                field: "Field B (South)",
                plantedDate: new Date("2025-06-01"),
                estimatedReadyDate: new Date("2025-10-15"),
                optimalDate: "2025-10-22",
                expectedYield: 600,
                yieldUnit: "kg",
                notes: "Second harvest, improved fertilizer",
            },
            {
                cropId: "crop-beans-001",
                farmId: "farm-demo",
                cropName: "Beans",
                field: "Field C (West)",
                plantedDate: new Date("2025-07-01"),
                estimatedReadyDate: new Date("2025-11-01"),
                optimalDate: "2025-11-05",
                expectedYield: 200,
                yieldUnit: "bags",
                notes: "Drought tolerant crop, minimal irrigation",
            },
        ];

        const scheduleIds: string[] = [];

        for (const schedule of scheduleData) {
            const created = await createHarvestSchedule(userId, schedule);
            scheduleIds.push(created.id);
            console.log(`✅ Created schedule: ${schedule.field} (${created.id})`);
        }

        // ========================================================================
        // CREATE DEMO WORKERS
        // ========================================================================

        const workerData: CreateWorkerInput[] = [
            {
                name: "John Omondi",
                role: "Supervisor",
                phone: "+254712345678",
                email: "john.omondi@farm.local",
                experience: "8 years",
                assignedScheduleIds: [scheduleIds[0]],
                emergencyContact: {
                    name: "Mary Omondi",
                    relationship: "Sister",
                    phone: "+254712345679",
                },
            },
            {
                name: "Fatima Hassan",
                role: "Harvester",
                phone: "+254723456789",
                email: "fatima.hassan@farm.local",
                experience: "5 years",
                assignedScheduleIds: [scheduleIds[0], scheduleIds[1]],
            },
            {
                name: "David Kipchoge",
                role: "Harvester",
                phone: "+254734567890",
                email: "david.kipchoge@farm.local",
                experience: "3 years",
                assignedScheduleIds: [scheduleIds[2]],
            },
            {
                name: "Samuel Njoroge",
                role: "Transporter",
                phone: "+254745678901",
                email: "samuel.njoroge@farm.local",
                experience: "6 years",
                assignedScheduleIds: [scheduleIds[1], scheduleIds[2]],
                emergencyContact: {
                    name: "Grace Njoroge",
                    relationship: "Wife",
                    phone: "+254745678902",
                },
            },
        ];

        const workerIds: string[] = [];

        for (const worker of workerData) {
            const created = await createWorker(userId, worker);
            workerIds.push(created.id);
            console.log(`✅ Created worker: ${worker.name} (${created.id})`);
        }

        // ========================================================================
        // CREATE DEMO DELIVERIES
        // ========================================================================

        const deliveryData: CreateDeliveryInput[] = [
            {
                scheduleId: scheduleIds[0], // Corn
                assignedWorkerId: workerIds[1], // Fatima
                destination: "Market",
                destinationAddress: "Nairobi Central Market, Main Hall",
                quantity: 450,
                quantityUnit: "kg",
                scheduledDate: new Date("2025-09-21"),
                vehicleType: "Truck",
                transportCost: 3500,
                notes: "Premium grade corn, handle carefully",
            },
            {
                scheduleId: scheduleIds[0], // Corn
                assignedWorkerId: workerIds[3], // Samuel
                destination: "Warehouse",
                destinationAddress: "AgriHub Storage Facility, Kitengela",
                quantity: 200,
                quantityUnit: "kg",
                scheduledDate: new Date("2025-09-22"),
                vehicleType: "Van",
                transportCost: 2500,
                notes: "Backup storage for secondary market",
            },
            {
                scheduleId: scheduleIds[1], // Maize
                assignedWorkerId: workerIds[3], // Samuel
                destination: "Buyer",
                destinationAddress: "Kenya Grain Limited, Embakasi",
                quantity: 600,
                quantityUnit: "kg",
                scheduledDate: new Date("2025-10-25"),
                vehicleType: "Truck",
                transportCost: 4500,
                notes: "B2B sale, bulk order",
            },
            {
                scheduleId: scheduleIds[1], // Maize
                assignedWorkerId: workerIds[1], // Fatima
                destination: "Processor",
                destinationAddress: "Upendo Cornmeal Factory, Mombasa",
                quantity: 400,
                quantityUnit: "kg",
                scheduledDate: new Date("2025-10-26"),
                vehicleType: "Truck",
                transportCost: 5000,
                notes: "Processing contract, pre-approved",
            },
            {
                scheduleId: scheduleIds[2], // Beans
                assignedWorkerId: workerIds[1], // Fatima
                destination: "Market",
                destinationAddress: "Githurai Market, Mirema",
                quantity: 50,
                quantityUnit: "bags",
                scheduledDate: new Date("2025-11-08"),
                vehicleType: "Van",
                transportCost: 2000,
                notes: "Retail market sale",
            },
            {
                scheduleId: scheduleIds[2], // Beans
                assignedWorkerId: workerIds[3], // Samuel
                destination: "Warehouse",
                destinationAddress: "Community Coop Storage, Thika",
                quantity: 30,
                quantityUnit: "bags",
                scheduledDate: new Date("2025-11-09"),
                vehicleType: "Van",
                transportCost: 1500,
                notes: "Coop distribution center",
            },
        ];

        for (const delivery of deliveryData) {
            const created = await createDelivery(userId, delivery);
            console.log(
                `✅ Created delivery: ${delivery.destination} (${delivery.quantity} ${delivery.quantityUnit})`
            );
        }

        console.log("🎉 Demo data seeding completed successfully!");
        console.log(`📊 Summary:`);
        console.log(`   - ${scheduleIds.length} harvest schedules`);
        console.log(`   - ${workerIds.length} workers`);
        console.log(`   - ${deliveryData.length} deliveries`);
    } catch (error) {
        console.error("❌ Error seeding demo data:", error);
        throw error;
    }
}

/**
 * Optional: Clear all harvest data for a user (use with caution!)
 * 
 * ⚠️ WARNING: This permanently deletes all harvest data!
 * Only use in development or for resetting demo data.
 */
export async function clearAllHarvestData(userId: string): Promise<void> {
    console.warn("🗑️ Clearing ALL harvest data for user:", userId);
    console.warn("⚠️ This action cannot be undone!");

    // Implementation would require batch delete service
    // For now, manual deletion recommended via Firebase Console

    throw new Error(
        "Manual deletion recommended. Go to Firebase Console > Firestore > users/{uid}/harvest and delete collections manually."
    );
}

/**
 * Export demo data structure for reference
 */
export const DEMO_DATA_STRUCTURE = {
    schedules: [
        {
            cropName: "Corn",
            field: "Field A (North)",
            status: "Ready",
            expectedYield: "450 kg",
        },
        {
            cropName: "Maize",
            field: "Field B (South)",
            status: "Pending",
            expectedYield: "600 kg",
        },
        {
            cropName: "Beans",
            field: "Field C (West)",
            status: "Pending",
            expectedYield: "200 bags",
        },
    ],
    workers: [
        {
            name: "John Omondi",
            role: "Supervisor",
            experience: "8 years",
        },
        {
            name: "Fatima Hassan",
            role: "Harvester",
            experience: "5 years",
        },
        {
            name: "David Kipchoge",
            role: "Harvester",
            experience: "3 years",
        },
        {
            name: "Samuel Njoroge",
            role: "Transporter",
            experience: "6 years",
        },
    ],
    deliveryCount: 6,
};
