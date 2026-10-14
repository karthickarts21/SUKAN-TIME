import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  collection,
  getDocs,
  getDocFromServer,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AllMonthsData, MonthData, SalarySettings } from '../types';
import { MONTHS } from '../utils/storage';

/**
 * Deep-cleans an object to ensure no `undefined` values are passed to Firestore.
 * Firestore crashes if any property (even deeply nested) has value `undefined`.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as any;
  return JSON.parse(
    JSON.stringify(data, (_, value) => (value === undefined ? undefined : value))
  );
}

/**
 * Gets the active user ID for Firestore operations.
 * If user is authenticated, returns their UID.
 * If not authenticated, returns a persistent local user id so database saves always work.
 */
export function getActiveUserId(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  const storageKey = 'brotime_active_user_uid';
  let uid = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
  if (!uid) {
    uid = 'user_default';
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, uid);
      } catch {
        // ignore
      }
    }
  }
  return uid;
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with specific database ID if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Validate connection to Firestore as mandated by Firebase architecture
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline: please check your network connection.');
    }
    return false;
  }
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfile(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error syncing user profile:', err);
  }
}

/**
 * Save user's Salary Settings to Firestore
 */
export async function saveUserSalarySettings(
  userId: string,
  settings: SalarySettings
): Promise<void> {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'salary');
    const payload = cleanForFirestore({
      userId,
      ...settings,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(settingsRef, payload, { merge: true });
  } catch (err) {
    console.error('Error saving salary settings to Firestore:', err);
    throw err;
  }
}

/**
 * Get user's Salary Settings from Firestore
 */
export async function getUserSalarySettings(
  userId: string
): Promise<SalarySettings | null> {
  try {
    const settingsRef = doc(db, 'users', userId, 'settings', 'salary');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        basicSalary: data.basicSalary ?? 25000,
        dailyDutyHours: data.dailyDutyHours ?? '08:30',
        weeklyOff: data.weeklyOff ?? 'Sunday',
        overtimeMultiplier: data.overtimeMultiplier ?? 1,
        defaultPf: data.defaultPf ?? 1800,
        defaultEsi: data.defaultEsi ?? 500,
        defaultAdvance: data.defaultAdvance ?? 0,
        defaultOtherDeduction: data.defaultOtherDeduction ?? 0,
        bankTransferAmount: data.bankTransferAmount ?? 25000,
        bankTransferMode: data.bankTransferMode ?? 'basic',
      };
    }
    return null;
  } catch (err) {
    console.error('Error loading salary settings from Firestore:', err);
    return null;
  }
}

/**
 * Delete a specific day entry from Firestore map so it is permanently removed
 */
export async function deleteUserDayRecord(
  userId: string,
  monthName: string,
  dayNumber: number
): Promise<void> {
  try {
    const monthRef = doc(db, 'users', userId, 'months', monthName);
    await updateDoc(monthRef, {
      [`dailyEntries.${dayNumber}`]: deleteField(),
      [`dailyEntries.${String(dayNumber)}`]: deleteField(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`Note on deleteUserDayRecord in Firestore:`, err);
  }
}

/**
 * Save a single month's data to Firestore under /users/{userId}/months/{monthName}
 * Sanitizes all payload data deeply to remove undefined values so Firestore never rejects the write.
 */
export async function saveUserMonthData(
  userId: string,
  monthName: string,
  monthData: MonthData
): Promise<void> {
  try {
    const monthRef = doc(db, 'users', userId, 'months', monthName);

    // Compute effective bill count across top-level and salaryData
    const effectiveBillCount =
      typeof monthData.billCount === 'number'
        ? monthData.billCount
        : typeof monthData.salaryData?.billCount === 'number'
        ? monthData.salaryData.billCount
        : 0;

    const consolidatedSalaryData = {
      ...(monthData.salaryData || {}),
      billCount: effectiveBillCount,
      billIncentiveManual: effectiveBillCount * 30,
    };

    // Sanitize data before saving (deep remove all undefined fields)
    const rawPayload: Record<string, any> = {
      userId,
      monthName,
      date: monthData.date || '',
      sections: monthData.sections,
      dailyEntries: monthData.dailyEntries || {},
      manualHolidays: Array.isArray(monthData.manualHolidays) ? monthData.manualHolidays : [],
      manualLeaves: Array.isArray(monthData.manualLeaves) ? monthData.manualLeaves : [],
      manualHalfDays: Array.isArray(monthData.manualHalfDays) ? monthData.manualHalfDays : [],
      billCount: effectiveBillCount,
      salaryData: consolidatedSalaryData,
      updatedAt: new Date().toISOString(),
    };
    if (monthData.lastSavedAt) {
      rawPayload.lastSavedAt = monthData.lastSavedAt;
    }

    const payload = cleanForFirestore(rawPayload);

    // Overwrite the month doc completely so deleted daily entries or cleared data are truly removed
    await setDoc(monthRef, payload);

    // Also update /app_data/current_month as a live mirror
    setDoc(doc(db, 'app_data', 'current_month'), payload).catch(() => {});
  } catch (err) {
    console.error(`Error saving month ${monthName} to Firestore:`, err);
    throw err;
  }
}

/**
 * Save the entire application state (all months, daily logs, selected month, settings)
 * to Firestore under /app_data/overall and /users/{userId}/overview/state.
 */
export async function saveOverallAppData(
  userId: string,
  data: {
    selectedMonth: string;
    months: AllMonthsData;
    salarySettings?: SalarySettings;
  }
): Promise<void> {
  try {
    const rawPayload = {
      userId,
      selectedMonth: data.selectedMonth,
      months: data.months,
      salarySettings: data.salarySettings,
      updatedAt: new Date().toISOString(),
    };
    const payload = cleanForFirestore(rawPayload);

    await Promise.allSettled([
      setDoc(doc(db, 'app_data', 'overall'), payload),
      setDoc(doc(db, 'users', userId, 'overview', 'state'), payload),
    ]);
  } catch (err) {
    console.error('Error saving overall app data to Firestore:', err);
  }
}

/**
 * Load overall app state from Firestore
 */
export async function getOverallAppData(
  userId: string
): Promise<{
  selectedMonth?: string;
  months?: AllMonthsData;
  salarySettings?: SalarySettings;
} | null> {
  try {
    // 1. Try user overview
    const userOverviewSnap = await getDoc(doc(db, 'users', userId, 'overview', 'state'));
    if (userOverviewSnap.exists()) {
      return userOverviewSnap.data() as any;
    }

    // 2. Fallback to app_data/overall
    const globalSnap = await getDoc(doc(db, 'app_data', 'overall'));
    if (globalSnap.exists()) {
      return globalSnap.data() as any;
    }

    return null;
  } catch (err) {
    console.warn('Note loading overall app data from Firestore:', err);
    return null;
  }
}

/**
 * Load all months data for a user from Firestore
 * Reads the 12 monthly documents directly to avoid collection-wide query permissions issues.
 */
export async function getUserAllMonthsData(
  userId: string
): Promise<AllMonthsData | null> {
  try {
    const monthPromises = MONTHS.map(async (monthName) => {
      const monthRef = doc(db, 'users', userId, 'months', monthName);
      const snap = await getDoc(monthRef);
      if (snap.exists()) {
        const d = snap.data();
        const effectiveBillCount =
          typeof d.billCount === 'number'
            ? d.billCount
            : typeof d.salaryData?.billCount === 'number'
            ? d.salaryData.billCount
            : 0;
        return {
          monthName,
          data: {
            date: d.date,
            sections: d.sections,
            dailyEntries: d.dailyEntries || {},
            manualHolidays: Array.isArray(d.manualHolidays) ? d.manualHolidays : [],
            manualLeaves: Array.isArray(d.manualLeaves) ? d.manualLeaves : [],
            manualHalfDays: Array.isArray(d.manualHalfDays) ? d.manualHalfDays : [],
            billCount: effectiveBillCount,
            salaryData: {
              ...(d.salaryData || {}),
              billCount: effectiveBillCount,
              billIncentiveManual: effectiveBillCount * 30,
            },
            lastSavedAt: d.lastSavedAt,
          } as MonthData,
        };
      }
      return null;
    });

    const results = await Promise.all(monthPromises);
    const validMonths = results.filter(
      (r): r is { monthName: (typeof MONTHS)[number]; data: MonthData } => r !== null
    );

    if (validMonths.length === 0) {
      return null;
    }

    const result: AllMonthsData = {};
    validMonths.forEach(({ monthName, data }) => {
      result[monthName] = data;
    });

    return result;
  } catch (err) {
    console.error('Error loading all months data from Firestore:', err);
    return null;
  }
}

/**
 * Save all months data to Firestore (used when syncing local data upon login)
 */
export async function saveAllUserMonthsData(
  userId: string,
  monthsData: AllMonthsData
): Promise<void> {
  try {
    const promises = Object.entries(monthsData).map(([monthName, monthObj]) =>
      saveUserMonthData(userId, monthName, monthObj)
    );
    await Promise.all(promises);
  } catch (err) {
    console.error('Error saving all months data to Firestore:', err);
    throw err;
  }
}

/**
 * Subscribe in real-time to the user's salary settings.
 * Whenever salary settings are updated on any device, the onUpdate callback fires.
 */
export function subscribeToSalarySettings(
  userId: string,
  onUpdate: (settings: SalarySettings) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const settingsRef = doc(db, 'users', userId, 'settings', 'salary');
  return onSnapshot(
    settingsRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const settings: SalarySettings = {
          basicSalary: data.basicSalary ?? 25000,
          dailyDutyHours: data.dailyDutyHours ?? '08:30',
          weeklyOff: data.weeklyOff ?? 'Sunday',
          overtimeMultiplier: data.overtimeMultiplier ?? 1,
          defaultPf: data.defaultPf ?? 1800,
          defaultEsi: data.defaultEsi ?? 500,
          defaultAdvance: data.defaultAdvance ?? 0,
          defaultOtherDeduction: data.defaultOtherDeduction ?? 0,
          bankTransferAmount: data.bankTransferAmount ?? 25000,
          bankTransferMode: data.bankTransferMode ?? 'basic',
        };
        onUpdate(settings);
      }
    },
    (err) => {
      console.error('Real-time salary settings subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe in real-time to a specific month's data.
 * Whenever that month is updated on any device, the onUpdate callback fires.
 */
export function subscribeToMonthData(
  userId: string,
  monthName: string,
  onUpdate: (monthName: string, data: MonthData, updatedAt?: string) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const monthRef = doc(db, 'users', userId, 'months', monthName);
  return onSnapshot(
    monthRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const effectiveBillCount =
          typeof d.billCount === 'number'
            ? d.billCount
            : typeof d.salaryData?.billCount === 'number'
            ? d.salaryData.billCount
            : 0;
        const data: MonthData = {
          date: d.date,
          sections: d.sections,
          dailyEntries: d.dailyEntries || {},
          manualHolidays: Array.isArray(d.manualHolidays) ? d.manualHolidays : [],
          manualLeaves: Array.isArray(d.manualLeaves) ? d.manualLeaves : [],
          manualHalfDays: Array.isArray(d.manualHalfDays) ? d.manualHalfDays : [],
          billCount: effectiveBillCount,
          salaryData: {
            ...(d.salaryData || {}),
            billCount: effectiveBillCount,
            billIncentiveManual: effectiveBillCount * 30,
          },
          lastSavedAt: d.lastSavedAt,
        };
        onUpdate(monthName, data, d.updatedAt);
      }
    },
    (err) => {
      console.error(`Real-time month subscription error for ${monthName}:`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe in real-time to all 12 months for the authenticated user.
 * Each month document is individually monitored for changes without collection-wide queries.
 */
export function subscribeToAllMonths(
  userId: string,
  onUpdate: (monthName: string, data: MonthData, updatedAt?: string) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const unsubscribers = MONTHS.map((month) =>
    subscribeToMonthData(userId, month, onUpdate, onError)
  );

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
