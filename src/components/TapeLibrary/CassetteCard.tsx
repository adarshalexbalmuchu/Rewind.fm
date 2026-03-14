import { CassetteSVG } from './CassetteSVG';
import type { CassetteStyle } from '../../lib/colorUtils';
import styles from './CassetteCard.module.css';

interface Props {
  title: string;
  artist: string;
  cassetteStyle: CassetteStyle;
  isSelected: boolean;
  onClick: () => void;
  moodTag?: string;
  shelfName?: string;
  coverImage?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isUnavailable?: boolean;
  isLoading?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

export function CassetteCard({
  title,
  artist,
  cassetteStyle,
  isSelected,
  onClick,
  moodTag,
  shelfName,
  coverImage,
  isPinned,
  isArchived,
  isUnavailable,
  isLoading,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }

  if (isLoading) {
    return <div className={`${styles.card} ${styles.skeleton}`} />;
  }
  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''} ${isUnavailable ? styles.unavailableCard : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${title} by ${artist}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className={styles.cassWrap}>
        <CassetteSVG style={cassetteStyle} />
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{title}</div>
        <div className={styles.artist}>{artist}</div>
        {(isPinned || isArchived || isUnavailable) && (
          <div className={styles.badgeRow}>
            {isPinned && <span className={styles.badge}>PINNED</span>}
            {isArchived && <span className={styles.badge}>ARCHIVE</span>}
            {isUnavailable && <span className={`${styles.badge} ${styles.badgeWarn}`}>UNAVAILABLE</span>}
          </div>
        )}
        {(moodTag || shelfName) && (
          <div className={styles.metaRow}>
            {moodTag && <span className={styles.mood}>{moodTag}</span>}
            {shelfName && <span className={styles.shelf}>{shelfName}</span>}
          </div>
        )}
      </div>
      {coverImage && (
        <div className={styles.stamp}>
          <img src={coverImage} alt="cover" />
        </div>
      )}
    </div>
  );
}
