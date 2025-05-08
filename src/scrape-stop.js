export let continueScrape = true;

// Function to update the state
export const setContinueScrape = async (inputValue) => {
  continueScrape = inputValue;
  console.log("Scraping state set to: " + inputValue);
  return continueScrape;
};
