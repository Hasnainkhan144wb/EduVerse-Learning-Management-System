/**
 * Format total learning minutes into human readable hours & minutes string.
 * Examples:
 *  8   -> 8 min
 *  45  -> 45 min
 *  59  -> 59 min
 *  60  -> 1 hr
 *  61  -> 1 hr 1 min
 *  75  -> 1 hr 15 min
 *  150 -> 2 hrs 30 min
 *  180 -> 3 hrs
 *  245 -> 4 hrs 5 min
 */
export const formatLearningTime = (totalMinutes) => {
  if (totalMinutes === undefined || totalMinutes === null || isNaN(totalMinutes) || totalMinutes <= 0) {
    return '0 min';
  }

  const mins = Math.round(Number(totalMinutes));
  if (mins < 60) {
    return `${mins} min`;
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  const hrLabel = hours === 1 ? '1 hr' : `${hours} hrs`;

  if (remainingMins === 0) {
    return hrLabel;
  }

  return `${hrLabel} ${remainingMins} min`;
};
