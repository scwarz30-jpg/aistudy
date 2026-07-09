const SEOUL_TIME_ZONE = "Asia/Seoul";

function getSeoulDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

export function getSeoulDateString(date: Date) {
  const { year, month, day } = getSeoulDateParts(date);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getSeoulWeekStartDate(date: Date) {
  const { year, month, day } = getSeoulDateParts(date);
  const seoulDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = seoulDate.getUTCDay();
  const diffToMonday = (dayOfWeek + 6) % 7;

  seoulDate.setUTCDate(seoulDate.getUTCDate() - diffToMonday);

  return seoulDate.toISOString().slice(0, 10);
}

export { SEOUL_TIME_ZONE };
