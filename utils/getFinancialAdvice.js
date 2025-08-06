// Simple in-memory cache for financial advice
const adviceCache = new Map();
// Timestamp of last API call
let lastApiCall = 0;
// Minimum delay between API calls (in milliseconds)
const MIN_DELAY = 30000; // 30 seconds

import { GoogleGenerativeAI } from "@google/generative-ai";

// Check if API key is available
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  console.error("Google Gemini API key is missing. Please check your .env file.");
}

const getFinancialAdvice = async (totalBudget, totalIncome, totalSpend) => {
  console.log(totalBudget, totalIncome, totalSpend);
  
  // Create a cache key based on the parameters
  const cacheKey = `${totalBudget}-${totalIncome}-${totalSpend}`;
  
  // Check if we have cached advice for these parameters
  if (adviceCache.has(cacheKey)) {
    console.log("Returning cached advice");
    return adviceCache.get(cacheKey);
  }
  
  // Check if enough time has passed since the last API call
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < MIN_DELAY) {
    const delay = MIN_DELAY - timeSinceLastCall;
    console.log(`Rate limiting: waiting ${delay}ms before next API call`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    const userPrompt = `
      Based on the following financial data:
      - Total Budget: ${totalBudget} USD
      - Expenses: ${totalSpend} USD
      - Incomes: ${totalIncome} USD
      Provide detailed financial advice in 2 sentences to help the user manage their finances more effectively.
    `;

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const advice = response.text();
    
    // Update last API call timestamp
    lastApiCall = Date.now();
    
    // Cache the advice
    adviceCache.set(cacheKey, advice);

    console.log(advice);
    return advice;
  } catch (error) {
    console.error("Error fetching financial advice:", error);
    
    // If it's a rate limit error, provide a more specific message
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      return "Sorry, we're experiencing high demand right now. Please wait a moment and try again.";
    }
    
    return "Sorry, I couldn't fetch the financial advice at this moment. Please try again later.";
  }
};

export default getFinancialAdvice;
