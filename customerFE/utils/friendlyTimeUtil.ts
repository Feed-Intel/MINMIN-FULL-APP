import dayjs from "dayjs";
import { i18n } from "@/app/_layout";

export function friendlyTime(createdTime: string): string {
  const now = dayjs();
  const created = dayjs(createdTime);
  const diffInSeconds = now.diff(created, "second");

  const secondsInMinute = 60;
  const secondsInHour = 60 * secondsInMinute;
  const secondsInDay = 24 * secondsInHour;

  if (diffInSeconds < secondsInMinute) {
    return i18n.t("just_now"); // i18n
  } else if (diffInSeconds < secondsInHour) {
    const minutes = Math.floor(diffInSeconds / secondsInMinute);
    return i18n.t("minutes_ago", { count: minutes }); // i18n
  } else if (diffInSeconds < secondsInDay) {
    const hours = Math.floor(diffInSeconds / secondsInHour);
    return i18n.t("hours_ago", { count: hours }); // i18n
  } else if (diffInSeconds < 30 * secondsInDay) {
    const days = Math.floor(diffInSeconds / secondsInDay);
    return i18n.t("days_ago", { count: days }); // i18n
  } else {
    return i18n.t("on_date", { date: created.format("MMMM D, YYYY") }); // i18n
  }
}
