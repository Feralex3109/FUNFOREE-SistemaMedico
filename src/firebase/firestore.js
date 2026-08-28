import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

// ─── Generic CRUD ────────────────────────────────────────────────────────────

const STORAGE_PREFIX = "funforee-local-store";

const getStorageKey = (collectionName) => `${STORAGE_PREFIX}:${collectionName}`;

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") return new Date(value).getTime();
  return 0;
};

const sortByCreatedAtDesc = (items) =>
  [...items].sort((a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt));

const readLocalCollection = (collectionName) => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(collectionName));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocalCollection = (collectionName, items) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getStorageKey(collectionName), JSON.stringify(items));
  } catch {
    // Ignore storage write failures
  }
};

const normalizeLocalItem = (collectionName, item) => {
  const next = { ...item };
  if (!next.id) {
    next.id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  if (!Object.prototype.hasOwnProperty.call(next, "active")) {
    next.active = true;
  }
  if (!next.createdAt) {
    next.createdAt = new Date();
  }
  if (!next.updatedAt) {
    next.updatedAt = next.createdAt;
  }
  return next;
};

const getConstraintInfo = (constraint) => {
  if (!constraint || typeof constraint !== "object") return null;
  const fieldPath = constraint.fieldPath || constraint.field || constraint.fieldName || null;
  const opStr = constraint.opStr || constraint.op || constraint.operator || null;
  const value = constraint.value ?? null;
  return fieldPath && opStr ? { fieldPath, opStr, value } : null;
};

const applyFiltersToItems = (items, filters = []) => {
  if (!filters.length) return items;
  return items.filter((item) => {
    return filters.every((filter) => {
      const constraint = getConstraintInfo(filter);
      if (!constraint) return true;
      const actualValue = item[constraint.fieldPath];
      const expectedValue = constraint.value;
      switch (constraint.opStr) {
        case "==": return actualValue === expectedValue;
        case "!=": return actualValue !== expectedValue;
        case ">": return actualValue > expectedValue;
        case ">=": return actualValue >= expectedValue;
        case "<": return actualValue < expectedValue;
        case "<=": return actualValue <= expectedValue;
        default: return true;
      }
    });
  });
};

export const addDocument = async (collectionName, data, userId) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
    });
    return docRef.id;
  } catch {
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const items = readLocalCollection(collectionName);
    const record = normalizeLocalItem(collectionName, {
      ...data,
      id,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    });
    writeLocalCollection(collectionName, [...items, record]);
    return id;
  }
};

export const setDocument = async (collectionName, docId, data, userId) => {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
    });
  } catch {
    const items = readLocalCollection(collectionName);
    const nextItems = items.filter((item) => item.id !== docId);
    const record = normalizeLocalItem(collectionName, {
      ...data,
      id: docId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    });
    writeLocalCollection(collectionName, [...nextItems, record]);
  }
};

export const updateDocument = async (collectionName, docId, data) => {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch {
    const items = readLocalCollection(collectionName);
    const existing = items.find((item) => item.id === docId);
    const updatedRecord = normalizeLocalItem(collectionName, {
      ...(existing || {}),
      ...data,
      id: docId,
      updatedAt: new Date(),
    });
    const nextItems = existing ? items.map((item) => (item.id === docId ? updatedRecord : item)) : [...items, updatedRecord];
    writeLocalCollection(collectionName, nextItems);
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch {
    const items = readLocalCollection(collectionName).filter((item) => item.id !== docId);
    writeLocalCollection(collectionName, items);
  }
};

export const softDeleteDocument = async (collectionName, docId) => {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      active: false,
      updatedAt: serverTimestamp(),
    });
  } catch {
    const items = readLocalCollection(collectionName);
    const nextItems = items.map((item) => (item.id === docId ? { ...item, active: false, updatedAt: new Date() } : item));
    writeLocalCollection(collectionName, nextItems);
  }
};

export const getDocument = async (collectionName, docId) => {
  try {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch {
    const item = readLocalCollection(collectionName).find((entry) => entry.id === docId);
    return item ? { ...item } : null;
  }
};

export const getCollection = async (collectionName, filters = []) => {
  try {
    let q = collection(db, collectionName);
    if (filters.length > 0) {
      q = query(q, ...filters);
    }
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return sortByCreatedAtDesc(items);
  } catch {
    const items = readLocalCollection(collectionName);
    return sortByCreatedAtDesc(applyFiltersToItems(items, filters));
  }
};

export const getActiveDocuments = async (collectionName) => {
  try {
    const q = query(collection(db, collectionName), where("active", "==", true));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return sortByCreatedAtDesc(items);
  } catch {
    const items = readLocalCollection(collectionName).filter((item) => item.active !== false);
    return sortByCreatedAtDesc(items);
  }
};

// ─── Audit Log ───────────────────────────────────────────────────────────────

export const logAudit = async ({ userId, action, module, documentId, details }) => {
  try {
    await addDoc(collection(db, "auditLogs"), {
      userId,
      action,
      module,
      documentId: documentId || "",
      details: details || "",
      timestamp: serverTimestamp(),
    });
  } catch {
    const items = readLocalCollection("auditLogs");
    writeLocalCollection("auditLogs", [
      ...items,
      normalizeLocalItem("auditLogs", {
        userId,
        action,
        module,
        documentId: documentId || "",
        details: details || "",
        timestamp: new Date(),
      }),
    ]);
  }
};

// ─── Notifications ───────────────────────────────────────────────────────────

export const createNotification = async (userId, message, type = "info", link = "") => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      message,
      type,
      read: false,
      link,
      createdAt: serverTimestamp(),
    });
  } catch {
    const items = readLocalCollection("notifications");
    writeLocalCollection("notifications", [
      ...items,
      normalizeLocalItem("notifications", {
        userId,
        message,
        type,
        read: false,
        link,
        createdAt: new Date(),
      }),
    ]);
  }
};

export const getNotifications = async (userId) => {
  try {
    const q = query(collection(db, "notifications"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return sortByCreatedAtDesc(items);
  } catch {
    const items = readLocalCollection("notifications").filter((item) => item.userId === userId);
    return sortByCreatedAtDesc(items);
  }
};

export const markNotificationRead = async (notifId) => {
  try {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
  } catch {
    const items = readLocalCollection("notifications");
    writeLocalCollection(
      "notifications",
      items.map((item) => (item.id === notifId ? { ...item, read: true } : item))
    );
  }
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const [patients, appointments, episodes, medications, users] = await Promise.all([
    getDocs(query(collection(db, "patients"), where("active", "==", true))),
    getDocs(query(collection(db, "appointments"), where("active", "==", true))),
    getDocs(query(collection(db, "episodes"), where("active", "==", true))),
    getDocs(query(collection(db, "medications"), where("active", "==", true))),
    getDocs(query(collection(db, "users"), where("active", "==", true))),
  ]);

  const activePatients = patients.docs.filter((d) => d.data().estado === "activo").length;
  const deliveredMeds = medications.docs.reduce(
    (sum, d) => sum + (d.data().historialEntregas?.length || 0),
    0
  );

  return {
    totalPatients: patients.size,
    activePatients,
    totalAppointments: appointments.size,
    totalEpisodes: episodes.size,
    deliveredMedications: deliveredMeds,
    totalUsers: users.size,
    patientsData: patients.docs.map((d) => ({ id: d.id, ...d.data() })),
    episodesData: episodes.docs.map((d) => ({ id: d.id, ...d.data() })),
    appointmentsData: appointments.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
};

export { serverTimestamp, Timestamp };
