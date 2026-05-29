import { useState } from 'react';
import { flagUrl } from '../utils/flags.js';

export function Flag({ team, size = 'md' }) {
  const url = flagUrl(team, size === 'lg' ? 160 : 80);
  const className = `flag-img flag-img--${size}`;
  const label = team?.nameTR || team?.nameEN || team?.fifaCode || 'flag';
  const [failedUrl, setFailedUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const canLoadImage = Boolean(url && failedUrl !== url);
  const isLoaded = canLoadImage && loadedUrl === url;
  const fallback = team?.flagEmoji || team?.fifaCode || '';

  return (
    <span className={`${className} flag-img--fallback ${isLoaded ? 'flag-img--loaded' : ''}`} role="img" aria-label={`${label} flag`}>
      <span className="flag-img__fallback">{fallback}</span>
      {canLoadImage ? (
        <img
          className="flag-img__image"
          src={url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoadedUrl(url)}
          onError={() => setFailedUrl(url)}
        />
      ) : null}
    </span>
  );
}
