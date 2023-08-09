export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export default function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = MONTHS[date.getMonth()];
  const day = date.getDate() > 9
    ? date.getDate()
    : `0${date.getDate()}`;
  const hours = date.getHours() > 9
    ? date.getHours()
    : `0${date.getHours()}`;
  const minutes = date.getMinutes() > 9
    ? date.getMinutes()
    : `0${date.getMinutes()}`;
  const seconds = date.getSeconds() > 9
    ? date.getSeconds()
    : `0${date.getSeconds()}`;
  return `${month} ${day}, ${year}, at ${hours}:${minutes}:${seconds}`;
}
