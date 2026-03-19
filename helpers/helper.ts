export const formatTime = (date: Date | string | number | undefined) => {
  if (!date) return '-';

  // convert the input to a Date object
  const d = new Date(date);

  // convert UTC to local time
  const localHours = d.getHours();
  const localMinutes = d.getMinutes();

  // determine AM or PM
  const ampm = localHours >= 12 ? 'PM' : 'AM';

  // convert to 12-hour format
  let hours = localHours % 12;
  if (hours === 0) hours = 12;

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = localMinutes.toString().padStart(2, '0');

  return `${hoursStr}:${minutesStr} ${ampm}`;
};