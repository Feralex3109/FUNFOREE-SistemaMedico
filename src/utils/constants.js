export const ROLES = {
  ADMIN: "admin",
  MEDICO: "medico",
  ADMINISTRATIVO: "administrativo",
};

export const ROLE_LABELS = {
  admin: "Administrador",
  medico: "Médico",
  administrativo: "Personal Administrativo",
};

export const DIAGNOSTICOS = [
  { value: "hemofilia_a", label: "Hemofilia A" },
  { value: "hemofilia_b", label: "Hemofilia B" },
  { value: "von_willebrand", label: "Enfermedad de Von Willebrand" },
];

export const ESTADOS_PACIENTE = [
  { value: "activo", label: "Activo", color: "success" },
  { value: "inactivo", label: "Inactivo", color: "default" },
  { value: "critico", label: "Crítico", color: "error" },
  { value: "seguimiento", label: "En Seguimiento", color: "warning" },
];

export const SEXOS = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
  { value: "otro", label: "Otro" },
];

export const GRAVEDAD_EPISODIO = [
  { value: "leve", label: "Leve", color: "warning" },
  { value: "moderado", label: "Moderado", color: "info" },
  { value: "grave", label: "Grave", color: "error" },
  { value: "muy_grave", label: "Muy Grave", color: "error" },
];

export const ESTADOS_CITA = [
  { value: "programada", label: "Programada", color: "info" },
  { value: "confirmada", label: "Confirmada", color: "primary" },
  { value: "completada", label: "Completada", color: "success" },
  { value: "cancelada", label: "Cancelada", color: "error" },
  { value: "no_asistio", label: "No Asistió", color: "warning" },
];

export const TIPOS_TRATAMIENTO = [
  { value: "tratamiento", label: "Tratamiento" },
  { value: "profilaxis", label: "Profilaxis" },
];

export const ZONAS_CORPORALES = [
  "Articulación (codo)",
  "Articulación (rodilla)",
  "Articulación (tobillo)",
  "Articulación (hombro)",
  "Articulación (cadera)",
  "Articulación (muñeca)",
  "Músculo (cuádriceps)",
  "Músculo (pantorrilla)",
  "Músculo (bíceps)",
  "Psoas",
  "Cerebral / SNC",
  "Gastrointestinal",
  "Urogenital",
  "Mucosa oral",
  "Nasal",
  "Otra",
];

export const EPS_LISTA = [
  "Sura",
  "Nueva EPS",
  "Sanitas",
  "Coosalud",
  "Compensar",
  "Famisanar",
  "Salud Total",
  "Mutual Ser",
  "Aliansalud",
  "Medimás",
  "Coomeva",
  "Convida",
  "Otra",
];

export const AUDIT_ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  VIEW: "VIEW",
  EXPORT: "EXPORT",
};

export const MODULE_PERMISSIONS = {
  users: ["admin"],
  patients: ["admin", "medico", "administrativo"],
  medicalRecords: ["admin", "medico"],
  treatments: ["admin", "medico"],
  episodes: ["admin", "medico"],
  medications: ["admin", "medico", "administrativo"],
  appointments: ["admin", "medico", "administrativo"],
  laboratories: ["admin", "medico"],
  reports: ["admin", "medico"],
  auditLogs: ["admin"],
};
