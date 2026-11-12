function formatTag(tag) {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export default function TagList({ tags }) {
  if (!tags?.length) return null;

  return (
    <ul className="wiki-tags" aria-label="Taggar">
      {tags.map((tag) => (
        <li className="wiki-tag" key={tag}>{formatTag(tag)}</li>
      ))}
    </ul>
  );
}