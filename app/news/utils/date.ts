type DateFormatOptions = Intl.DateTimeFormatOptions;

const safeFormatDate = (value: string, options: DateFormatOptions) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("id-ID", options).format(date);
};

export class NewsDateFormatter {
  static forList(value: string): string {
    return safeFormatDate(value, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  static forDetail(value: string): string {
    return safeFormatDate(value, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}
