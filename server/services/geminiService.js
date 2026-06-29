/**
 * Gemini AI Service — Rev.AI
 *
 * Currently uses keyword-based analysis to classify sentiment, detect themes,
 * and generate management responses. When the real Gemini API key is configured,
 * this module can be updated to call the Gemini API while keeping the same
 * exported function signature.
 */

// ──────────────────────────────────────────────
//  Keyword Dictionaries for Classification
// ──────────────────────────────────────────────

const SENTIMENT_KEYWORDS = {
  positive: [
    'amazing', 'wonderful', 'excellent', 'fantastic', 'great', 'love', 'loved',
    'beautiful', 'perfect', 'best', 'incredible', 'outstanding', 'superb',
    'delightful', 'comfortable', 'clean', 'friendly', 'helpful', 'recommend',
    'enjoyed', 'pleasant', 'cozy', 'warm', 'welcoming', 'spectacular',
    'breathtaking', 'memorable', 'lovely', 'charming', 'peaceful', 'serene',
    'splendid', 'gorgeous', 'immaculate', 'delicious', 'tasty', 'fresh',
    'attentive', 'generous', 'thoughtful', 'awesome', 'paradise', 'heaven',
    'exceptional', 'brilliant', 'magical', 'stunning', 'spotless', 'satisfying',
    'happy', 'glad', 'impressed', 'thank', 'thanks', 'appreciate', 'bliss',
    'pristine', 'gracious', 'kind', 'hospitable', 'homely', 'scenic',
  ],
  negative: [
    'terrible', 'horrible', 'worst', 'awful', 'dirty', 'noisy', 'rude',
    'disappointing', 'disappointed', 'poor', 'bad', 'uncomfortable', 'cold',
    'broken', 'stale', 'overpriced', 'expensive', 'slow', 'unprofessional',
    'disgusting', 'filthy', 'unclean', 'bug', 'bugs', 'insects', 'cockroach',
    'mold', 'mouldy', 'damp', 'smelly', 'smell', 'noise', 'loud', 'unsafe',
    'unfriendly', 'unhelpful', 'ignored', 'neglected', 'cramped', 'tiny',
    'unacceptable', 'mediocre', 'bland', 'tasteless', 'stained', 'leaking',
    'nightmare', 'regret', 'avoid', 'never again', 'hate', 'waste',
    'overrated', 'scam', 'fraud', 'complained', 'complaint', 'refund',
  ],
};

const THEME_KEYWORDS = {
  food: [
    'food', 'breakfast', 'dinner', 'lunch', 'meal', 'meals', 'cook', 'cooking',
    'kitchen', 'restaurant', 'eat', 'eating', 'delicious', 'tasty', 'cuisine',
    'dish', 'dishes', 'menu', 'chef', 'recipe', 'snack', 'tea', 'coffee',
    'homemade', 'organic', 'fresh', 'spice', 'spices', 'flavor', 'flavour',
    'bread', 'rice', 'chicken', 'vegetarian', 'vegan', 'buffet', 'fruit',
  ],
  host: [
    'host', 'hosts', 'owner', 'owners', 'staff', 'manager', 'hospitality',
    'welcoming', 'friendly', 'helpful', 'responsive', 'attentive', 'rude',
    'service', 'reception', 'check-in', 'checkin', 'checkout', 'check-out',
    'greet', 'greeting', 'communication', 'assistance', 'guide', 'guided',
    'caretaker', 'housekeeper', 'concierge', 'team', 'courtesy',
  ],
  location: [
    'location', 'view', 'views', 'mountain', 'mountains', 'valley', 'river',
    'lake', 'nature', 'forest', 'trek', 'trekking', 'hike', 'hiking',
    'scenery', 'scenic', 'landscape', 'surroundings', 'area', 'nearby',
    'town', 'village', 'remote', 'accessible', 'transport', 'distance',
    'drive', 'road', 'hill', 'altitude', 'sunset', 'sunrise', 'panoramic',
    'peaceful', 'quiet', 'serene', 'secluded', 'isolated', 'jungle',
  ],
  cleanliness: [
    'clean', 'cleanliness', 'dirty', 'spotless', 'tidy', 'hygiene',
    'hygienic', 'sanitary', 'dust', 'dusty', 'stain', 'stained', 'mold',
    'mouldy', 'bathroom', 'toilet', 'shower', 'towel', 'sheets', 'linen',
    'bedding', 'pillow', 'mattress', 'carpet', 'floor', 'maintenance',
    'maintained', 'upkeep', 'condition', 'bug', 'bugs', 'insects', 'pest',
    'cockroach', 'spider', 'ant', 'ants', 'smell', 'odor', 'odour',
  ],
  value: [
    'value', 'price', 'pricing', 'money', 'worth', 'cost', 'cheap',
    'expensive', 'overpriced', 'affordable', 'budget', 'bargain', 'deal',
    'rate', 'rates', 'charge', 'charges', 'fee', 'fees', 'pay', 'paid',
    'bang for buck', 'economic', 'economical', 'reasonable', 'fair',
    'justified', 'refund', 'discount', 'offer', 'package', 'inclusive',
  ],
  experience: [
    'experience', 'stay', 'stayed', 'trip', 'visit', 'vacation', 'holiday',
    'getaway', 'retreat', 'adventure', 'memory', 'memories', 'memorable',
    'atmosphere', 'ambiance', 'ambience', 'vibe', 'feel', 'feeling',
    'overall', 'recommend', 'return', 'come back', 'enjoy', 'enjoyed',
    'relaxing', 'relaxed', 'rejuvenating', 'refreshing', 'unforgettable',
    'unique', 'special', 'authentic', 'traditional', 'cultural', 'local',
    'escape', 'paradise', 'heaven', 'bliss', 'magical', 'enchanting',
  ],
};

// ──────────────────────────────────────────────
//  Response Templates by sentiment × theme
// ──────────────────────────────────────────────

const RESPONSE_TEMPLATES = {
  positive: {
    food: [
      "Thank you for your kind words about our cuisine! Our team takes pride in serving fresh, homemade meals.",
      "We're thrilled you loved the food! Our kitchen team will be delighted to hear this feedback.",
      "Thank you! We source our ingredients locally and it's wonderful to know you appreciated our meals.",
    ],
    host: [
      "Thank you for recognizing our team's hospitality! We strive to make every guest feel at home.",
      "Your warm feedback means the world to our staff. We look forward to welcoming you back!",
      "We're so glad our team made your stay special. Hospitality is at the heart of what we do.",
    ],
    location: [
      "We're glad you enjoyed the stunning views! The natural beauty around us is truly a treasure.",
      "Thank you! We're blessed with a beautiful location and love sharing it with our guests.",
      "The scenery around our homestay is indeed magical. So happy it added to your experience!",
    ],
    cleanliness: [
      "Thank you for noticing our attention to cleanliness! We maintain high hygiene standards throughout.",
      "We're pleased to hear the cleanliness met your expectations. It's a top priority for us.",
      "Cleanliness is fundamental to guest comfort. Thank you for this encouraging feedback!",
    ],
    value: [
      "Thank you! We believe in offering great value and authentic experiences at fair prices.",
      "We're glad you found our homestay to be good value. We aim to make quality stays accessible.",
      "Thank you for the positive feedback on value! We work hard to keep our offerings worthwhile.",
    ],
    experience: [
      "What a beautiful review! We're so happy your stay was memorable. Hope to see you again!",
      "Thank you for sharing your wonderful experience. Creating lasting memories is our mission.",
      "We're delighted you had such a positive experience. Your review truly made our day!",
    ],
  },
  neutral: {
    food: [
      "Thank you for your honest feedback. We're always looking to enhance our menu and dining experience.",
      "We appreciate your review. We'll take your food comments into consideration for improvements.",
    ],
    host: [
      "Thank you for staying with us. We'll share your feedback with our team for improvement.",
      "We appreciate your candid review about our service. We're working on enhancing the guest experience.",
    ],
    location: [
      "Thank you for your feedback about the location. We hope to make access more convenient for future guests.",
      "We appreciate your honest comments. We're exploring ways to improve the local experience.",
    ],
    cleanliness: [
      "Thank you for your feedback on cleanliness. We'll reinforce our housekeeping protocols immediately.",
      "We take cleanliness seriously and appreciate your candid comments. We'll address this promptly.",
    ],
    value: [
      "Thank you for your feedback regarding pricing. We continually review our rates to ensure fair value.",
      "We appreciate your honest assessment of the value. We'll review our pricing and offerings.",
    ],
    experience: [
      "Thank you for choosing our homestay. We'll work on making the overall experience even better.",
      "We appreciate your stay and feedback. We're always striving to improve our guest experience.",
    ],
  },
  negative: {
    food: [
      "We sincerely apologize for the dining experience. We're reviewing our menu and kitchen procedures to ensure better quality.",
      "We're sorry the food didn't meet your expectations. We've taken your feedback to our kitchen team for immediate action.",
    ],
    host: [
      "We deeply apologize for the service shortcomings. We're conducting staff training to prevent such experiences.",
      "We're sorry about your interaction with our team. This isn't the hospitality standard we uphold, and we're addressing it.",
    ],
    location: [
      "We apologize for any inconveniences related to our location. We're working on providing better directions and transport options.",
      "We're sorry the location aspects fell short. We'll improve our communication about access and surroundings.",
    ],
    cleanliness: [
      "We sincerely apologize for the cleanliness issues. We've immediately reinforced our housekeeping standards and protocols.",
      "This is unacceptable by our standards. We've taken urgent steps to address the hygiene concerns you've raised.",
    ],
    value: [
      "We're sorry you didn't feel you received good value. We're reviewing our pricing to ensure it matches the quality we offer.",
      "We apologize for the pricing concern. We're reassessing our packages to provide better value for our guests.",
    ],
    experience: [
      "We're truly sorry your stay wasn't enjoyable. We take this feedback seriously and are making changes to improve.",
      "We sincerely apologize for the disappointing experience. We'd love the chance to make it right if you visit again.",
    ],
  },
};

// ──────────────────────────────────────────────
//  Analysis Functions
// ──────────────────────────────────────────────

/**
 * Classify the sentiment of a review as positive, neutral, or negative.
 * @param {string} text - The review text
 * @returns {string} 'positive' | 'neutral' | 'negative'
 */
function classifySentiment(text) {
  const lower = text.toLowerCase();
  let posScore = 0;
  let negScore = 0;

  SENTIMENT_KEYWORDS.positive.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) posScore += matches.length;
  });

  SENTIMENT_KEYWORDS.negative.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) negScore += matches.length;
  });

  const total = posScore + negScore;
  if (total === 0) return 'neutral';

  const ratio = posScore / total;
  if (ratio >= 0.65) return 'positive';
  if (ratio <= 0.35) return 'negative';
  return 'neutral';
}

/**
 * Detect the primary theme of a review.
 * @param {string} text - The review text
 * @returns {string} One of: food, host, location, cleanliness, value, experience
 */
function detectTheme(text) {
  const lower = text.toLowerCase();
  const scores = {};

  Object.entries(THEME_KEYWORDS).forEach(([theme, keywords]) => {
    scores[theme] = 0;
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) scores[theme] += matches.length;
    });
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  // If no keywords matched, default to 'experience'
  if (sorted[0][1] === 0) return 'experience';
  return sorted[0][0];
}

/**
 * Generate a professional management response template.
 * @param {string} sentiment - The classified sentiment
 * @param {string} theme - The detected theme
 * @returns {string} A management response string
 */
function generateResponse(sentiment, theme) {
  const templates =
    RESPONSE_TEMPLATES[sentiment]?.[theme] ||
    RESPONSE_TEMPLATES[sentiment]?.experience;

  if (!templates || templates.length === 0) {
    return "Thank you for your feedback. We value every guest's opinion and are always working to improve.";
  }

  return templates[Math.floor(Math.random() * templates.length)];
}

// ──────────────────────────────────────────────
//  Exported Analysis Function
// ──────────────────────────────────────────────

/**
 * Analyze a single review text and return the full analysis object.
 * This is the main function called by the controller.
 *
 * @param {string} text - Raw review text
 * @returns {Object} { sentiment, theme, response }
 */
function analyzeReview(text) {
  const sentiment = classifySentiment(text);
  const theme = detectTheme(text);
  const response = generateResponse(sentiment, theme);

  return { sentiment, theme, response };
}

module.exports = { analyzeReview };
