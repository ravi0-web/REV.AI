import { useState } from 'react';
import { Send, FileText, Trash2, Zap } from 'lucide-react';

// 6 sample reviews for quick demo
const SAMPLE_REVIEWS = [
  "The homestay was absolutely beautiful! The mountain views from the balcony were breathtaking and the food was delicious. Our host was so warm and welcoming.",
  "Room was okay but the bathroom needed better cleaning. Found some dust under the bed. Location was nice though.",
  "Terrible experience. The room was dirty, the food was stale, and the staff was rude. Completely overpriced for what you get. Never coming back.",
  "The trekking trails nearby were amazing! Our host arranged a local guide for us. Great value for the price we paid.",
  "Food was average, nothing special. The breakfast could have been better. But the sunset view from the terrace was spectacular.",
  "One of the best homestays we've ever stayed at! The homemade organic meals, the peaceful location, and the incredibly helpful host made it an unforgettable experience."
];

export default function ReviewForm({ onAnalyze, isLoading }) {
  const [text, setText] = useState('');

  const reviewCount = text.trim()
    ? text.trim().split('\n').filter(line => line.trim().length > 0).length
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    const reviews = text
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    if (reviews.length > 0) {
      onAnalyze(reviews);
    }
  };

  const handleLoadSamples = () => {
    setText(SAMPLE_REVIEWS.join('\n'));
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="card review-form-container animate-in">
      <div className="card-header">
        <div className="card-title">
          <span className="icon primary"><FileText size={16} /></span>
          Paste Guest Reviews
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleLoadSamples}
            title="Load sample reviews"
          >
            <Zap size={14} />
            Load Samples
          </button>
          {text && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClear}
              title="Clear all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="textarea-wrapper">
          <textarea
            className="review-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Paste one or more guest reviews here...\nPut each review on a separate line for batch processing.\n\nExample:\nThe food was amazing and the host was very friendly!\nThe room was a bit dirty but the location was great.\nWorst stay ever. Never coming back to this place."}
            disabled={isLoading}
            id="review-input"
          />
        </div>

        <div className="form-footer">
          <div className="review-count">
            <FileText size={14} />
            <span className="count-num">{reviewCount}</span>
            {reviewCount === 1 ? 'review' : 'reviews'} detected
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={reviewCount === 0 || isLoading}
            id="analyze-btn"
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Analyzing...
              </>
            ) : (
              <>
                <Send size={16} />
                Analyze Reviews
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
