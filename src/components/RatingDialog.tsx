import { useEffect, useState } from 'react';
import type { MediaItem, MediaRating } from '../types';

const DEFAULT_RATING = 7;

type Props = {
  item: MediaItem | null;
  rating?: MediaRating;
  onClose: () => void;
  onSave: (item: MediaItem, rating: number | null) => Promise<void> | void;
};

export function RatingDialog({ item, rating, onClose, onSave }: Props) {
  const [value, setValue] = useState(rating?.rating ?? DEFAULT_RATING);

  useEffect(() => {
    setValue(rating?.rating ?? DEFAULT_RATING);
  }, [item, rating]);

  if (!item) return null;

  return (
    <div className="rating-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="rating-dialog" role="dialog" aria-modal="true" aria-labelledby="rating-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="rating-dialog-heading">
          <div>
            <p className="eyebrow">Your rating</p>
            <h2 id="rating-title">{item.title}</h2>
          </div>
          <button className="rating-close" onClick={onClose} aria-label="Close rating">×</button>
        </div>

        <div className="rating-value"><span>★</span>{value.toFixed(1)}<small>/ 10</small></div>
        <input
          className="rating-slider"
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          aria-label={`Rating for ${item.title}`}
        />
        <div className="rating-scale"><span>0</span><span>5</span><span>10</span></div>

        <div className="rating-dialog-actions">
          {rating && (
            <button
              className="secondary-action"
              onClick={() => {
                void onSave(item, null);
                onClose();
              }}
            >
              Clear rating
            </button>
          )}
          <div className="rating-dialog-spacer" />
          <button className="secondary-action" onClick={onClose}>Cancel</button>
          <button
            className="save-button"
            onClick={() => {
              void onSave(item, value);
              onClose();
            }}
          >
            Save rating
          </button>
        </div>
        <small className="rating-note">Ratings are private and stored only in your local MyMediaBox data.</small>
      </section>
    </div>
  );
}
