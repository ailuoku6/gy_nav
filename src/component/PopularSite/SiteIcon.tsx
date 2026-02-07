import { useState } from 'react';

const DEFAULT_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23e0e0e0' width='64' height='64' rx='8'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='20' font-family='sans-serif'%3E?%3C/text%3E%3C/svg%3E";

interface SiteIconProps {
  src: string;
  alt?: string;
  className?: string;
}

const SiteIcon = ({ src, alt = '', className }: SiteIconProps) => {
  const [error, setError] = useState(false);

  const displaySrc = error || !src ? DEFAULT_ICON : src;

  return (
    <div style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', height: 70, width: 70 }}>
      <img
        className={className}
        src={displaySrc}
        alt={alt}
        onError={() => setError(true)}
      />
    </div>

  );
};

export default SiteIcon;
