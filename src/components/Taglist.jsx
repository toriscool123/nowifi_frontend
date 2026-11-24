function formatTag(tag) {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export default function TagList({ tags, onTagClick }) {
  if (!tags?.length) return null;

  return (
    <ul className="wiki-tags" aria-label="Taggar">
      {tags.map((tag) => (
        <li key={tag}>
          <button
            type="button"
            className="wiki-tag text-button"
            onClick={(e) => {
              e.stopPropagation(); // Hindrar att wikikortet öppnas av misstag
              if (onTagClick) {
                onTagClick(tag);
              }
            }}
          >
            {formatTag(tag)}
          </button>
        </li>
      ))}
    </ul>
  );
}