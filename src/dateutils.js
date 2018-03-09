// @flow

export function strDateOnly(date: Date) {
  return date.toISOString().split('T')[0];
}

// addMonth is just a naive function to get new date with roughly next month.
// JavaScript Date behaves defensively, e.g. setting more days than month has,
// results in date of first day of next month, similar for months resulting in next year.
export function addMonth(d: Date) {
  const updatedDate = new Date(d);
  updatedDate.setMonth(d.getMonth() + 1);
  return updatedDate;
}
