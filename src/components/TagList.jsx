function formatTag(tag) {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export default function TagList({ tags, onTagClick }) {
  if (!tags?.length) return null;

  return (
    <ul className="wiki-tags" aria-label="Taggar">
      {tags.map((tag) => (
        <li key={tag}>
          {onTagClick ? (
            <button
              type="button"
              className="wiki-tag"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
            >
              {formatTag(tag)}
            </button>
          ) : (
            <span className="wiki-tag">{formatTag(tag)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}