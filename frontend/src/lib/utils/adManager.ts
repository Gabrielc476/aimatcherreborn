/**
 * Utility to manage ad display rules and metrics in client side storage.
 */

const AD_LAST_DATE_KEY = "aimatcher_last_analysis_date";
const AD_ANALYSIS_COUNT_KEY = "aimatcher_analysis_count";

/**
 * Checks if the current analysis execution warrants displaying a video ad.
 * Ad triggers:
 * 1. First matching analysis of the calendar day.
 * 2. Every 2 subsequent matching analyses (i.e. count is a multiple of 2).
 * 
 * This also increments and persists the count.
 * 
 * @returns boolean - true if a video ad should be shown
 */
export const checkAndRecordAnalysis = (): boolean => {
  if (typeof window === "undefined") return false;

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format
  const lastDate = localStorage.getItem(AD_LAST_DATE_KEY);
  const countStr = localStorage.getItem(AD_ANALYSIS_COUNT_KEY) || "0";
  let count = parseInt(countStr, 10);

  // Increment total analysis count
  count += 1;
  localStorage.setItem(AD_ANALYSIS_COUNT_KEY, count.toString());

  let showAd = false;

  // Rule 1: First analysis of the calendar day
  if (lastDate !== today) {
    showAd = true;
    localStorage.setItem(AD_LAST_DATE_KEY, today);
  }
  // Rule 2: Every 2 analyses (e.g. 2nd, 4th, 6th...)
  else if (count % 2 === 0) {
    showAd = true;
  }

  return showAd;
};

/**
 * Retrieves the current analysis statistics (for debug or info panels).
 */
export const getAnalysisStats = () => {
  if (typeof window === "undefined") {
    return { count: 0, lastDate: null };
  }
  return {
    count: parseInt(localStorage.getItem(AD_ANALYSIS_COUNT_KEY) || "0", 10),
    lastDate: localStorage.getItem(AD_LAST_DATE_KEY),
  };
};

/**
 * Resets the stats in localStorage to simplify testing and debugging.
 */
export const resetAnalysisStats = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AD_LAST_DATE_KEY);
  localStorage.setItem(AD_ANALYSIS_COUNT_KEY, "0");
};
