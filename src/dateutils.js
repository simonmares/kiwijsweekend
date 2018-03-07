// @flow

export function strDateOnly(date: Date) {
  return date.toISOString().split('T')[0];
}

// addMonth is just a naive function to get new date with next month.
// JavaScript Date behaves defensively, e.g. setting more days than month has,
// results in next month and first day, same for months resulting in next year.
export function addMonth(d: Date) {
  const updatedDate = new Date(d);
  updatedDate.setMonth(d.getMonth() + 1);
  return updatedDate;
}
