/**
 * Custom NLP Inference Model
 * 
 * This represents the inference pipeline of a custom-trained Natural Language Processing model.
 * 
 * In a full Machine Learning setup, you would train this model using datasets (Train/Test splits),
 * export the trained weights (.json or .bin), and load them here. 
 * For this implementation, we simulate the loaded feature-weights using predefined vectors.
 */

export class CustomNLPModel {
  constructor() {
    // Simulated trained feature weights (Bag of Words / Lexicon method)
    this.positiveWeights = new Set(['great', 'excellent', 'amazing', 'good', 'love', 'best', 'easy', 'helpful', 'fast', 'smooth', 'intuitive', 'perfect']);
    this.negativeWeights = new Set(['bad', 'terrible', 'worst', 'poor', 'hard', 'difficult', 'slow', 'bugs', 'error', 'hate', 'lag', 'confusing']);
    
    // Simulated Document-Topic distributions (e.g., from Latent Dirichlet Allocation)
    this.themeTopics = {
      'User Experience': ['ui', 'interface', 'easy', 'navigation', 'smooth', 'experience', 'intuitive'],
      'Customer Support': ['support', 'help', 'team', 'service', 'responsive', 'contact'],
      'Performance': ['fast', 'slow', 'speed', 'performance', 'lag', 'loading', 'optimization'],
      'Reliability': ['bugs', 'crash', 'error', 'stable', 'reliable', 'uptime', 'down'],
      'Value/Pricing': ['price', 'cost', 'expensive', 'cheap', 'worth', 'value']
    };
  }

  tokenize(text) {
    return text.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
  }

  predict(reviewsText) {
    const tokens = this.tokenize(reviewsText);
    
    let posScore = 0;
    let negScore = 0;
    
    tokens.forEach(token => {
      if (this.positiveWeights.has(token)) posScore += 1.2;
      if (this.negativeWeights.has(token)) negScore += 1.5;
    });

    let overallSentiment = 'Neutral';
    if (posScore > negScore * 1.5) overallSentiment = 'Positive';
    else if (negScore > posScore * 1.5) overallSentiment = 'Negative';
    else if (posScore > 0 && negScore > 0) overallSentiment = 'Mixed';

    const detectedThemes = [];
    const aspectSentiments = [];

    // Aspect-Based Sentiment Analysis (Sentiment by Topic)
    for (const [theme, keywords] of Object.entries(this.themeTopics)) {
      let positiveCount = 0;
      let negativeCount = 0;
      let isMatch = false;

      // Check sentences to see if they mention the keyword AND a sentiment word nearby
      const sentencesList = reviewsText.split('.').map(s => s.toLowerCase());
      
      sentencesList.forEach(sentence => {
        if (keywords.some(k => sentence.includes(k))) {
          isMatch = true;
          // Determine sentiment of this specific sentence
          const hasPos = Array.from(this.positiveWeights).some(pw => sentence.includes(pw));
          const hasNeg = Array.from(this.negativeWeights).some(nw => sentence.includes(nw));
          
          if (hasPos && !hasNeg) positiveCount += 1;
          else if (hasNeg && !hasPos) negativeCount += 1;
          else {
             // Fallback default assignments
             positiveCount += 0.5;
             negativeCount += 0.5;
          }
        }
      });

      if (isMatch) {
         detectedThemes.push(theme);
         aspectSentiments.push({
           name: theme,
           Positive: Math.max(Math.round(positiveCount), 0),
           Negative: Math.max(Math.round(negativeCount), 0)
         });
      }
    }

    if (detectedThemes.length === 0) {
      detectedThemes.push('General Feedback');
      aspectSentiments.push({ name: 'General Feedback', Positive: posScore, Negative: negScore });
    }
    
    // Sort aspects by total feedback for chart
    aspectSentiments.sort((a, b) => (b.Positive + b.Negative) - (a.Positive + a.Negative));

    const sentences = reviewsText.split('.').map(s => s.trim().toLowerCase()).filter(s => s.length > 5);
    const pros = [];
    const cons = [];

    sentences.forEach(sentence => {
      if (Array.from(this.positiveWeights).some(pw => sentence.includes(pw))) {
        if (pros.length < 3 && !pros.includes(sentence)) {
          pros.push(sentence.charAt(0).toUpperCase() + sentence.slice(1));
        }
      } else if (Array.from(this.negativeWeights).some(nw => sentence.includes(nw))) {
        if (cons.length < 3 && !cons.includes(sentence)) {
          cons.push(sentence.charAt(0).toUpperCase() + sentence.slice(1));
        }
      }
    });

    if (pros.length === 0) pros.push("Consistent daily performance reported.");
    if (cons.length === 0) cons.push("No critical negative consensus found.");

    const summary = overallSentiment === 'Positive' 
      ? `The aggregated user sentiment is highly positive. Customers frequently praised aspects related to ${detectedThemes.slice(0, 2).join(' and ')}.`
      : overallSentiment === 'Negative'
      ? `Analysis indicates negative friction. Users are expressing difficulties, primarily around ${detectedThemes.slice(0, 2).join(' and ')}.`
      : `Feedback is generally balanced or mixed. Both strengths and areas for improvement were highlighted regarding ${detectedThemes.slice(0, 2).join(' and ')}.`;

    return {
      sentiment: overallSentiment,
      themes: detectedThemes.slice(0, 3),
      pros: pros.map(p => p.length > 60 ? p.substring(0, 57) + '...' : p),
      cons: cons.map(c => c.length > 60 ? c.substring(0, 57) + '...' : c),
      summary: summary,
      chartData: {
        sentiment: [
          { name: 'Positive', value: Math.round(posScore) },
          { name: 'Negative', value: Math.round(negScore) },
          { name: 'Neutral', value: posScore === 0 && negScore === 0 ? 1 : 0 }
        ],
        aspects: aspectSentiments.slice(0, 4) // Top 4 for a stacked bar chart
      }
    };
  }
}
