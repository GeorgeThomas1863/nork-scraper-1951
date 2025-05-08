//STOP SCRAPE CHECK
export let continueScrape = true;

// Function to update the state
export const setContinueScrape = async (inputValue) => {
  continueScrape = inputValue;
  console.log("CONTINUE SCRAPE STATUS CHANGED TO: " + String(inputValue).toUpperCase());
  return continueScrape;
};

//SCRAPE ACTIVE CHECK (returns null if active, prevents multiple commands)s
export let scrapeActive = false;

export const setScrapeActive = async (inputValue) => {
  scrapeActive = inputValue;
  console.log("SCRAPE ACTIVE STATUS CHANGED TO: " + String(inputValue).toUpperCase());
  return scrapeActive;
};
