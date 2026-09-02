import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

export const formatDate = (date, fmt = "dd/MM/yyyy") => {
  if (!date) return "—";
  try {
    if (date instanceof Timestamp) return format(date.toDate(), fmt, { locale: es });
    if (date?.seconds) return format(new Date(date.seconds * 1000), fmt, { locale: es });
    if (typeof date === "string") {
      const parsed = parseISO(date);
      return isValid(parsed) ? format(parsed, fmt, { locale: es }) : "—";
    }
    if (date instanceof Date) return format(date, fmt, { locale: es });
    return "—";
  } catch {
    return "—";
  }
};

export const formatDateTime = (date) => formatDate(date, "dd/MM/yyyy HH:mm");

export const formatDateLong = (date) => formatDate(date, "d 'de' MMMM 'de' yyyy");

export const timestampToDate = (ts) => {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts?.seconds) return new Date(ts.seconds * 1000);
  return null;
};

export const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return "—";
  const hoy = new Date();
  const nac = fechaNacimiento instanceof Date ? fechaNacimiento : new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
};

export const generateId = () => Math.random().toString(36).substring(2, 9).toUpperCase();

export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value || 0);

export const truncateText = (text, maxLength = 50) => {
  if (!text) return "—";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};
