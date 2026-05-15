interface LastContactBadgeProps {
  date: Date | null;
}

const daysSince = (d: Date) =>
  Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));

export default function LastContactBadge({ date }: LastContactBadgeProps) {
  if (!date) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Aucun contact
      </span>
    );
  }
  const days = daysSince(date);
  let cls = 'bg-green-100 text-green-800';
  if (days > 14) cls = 'bg-red-100 text-red-800';
  else if (days > 7) cls = 'bg-yellow-100 text-yellow-800';
  const label = days === 0 ? "Aujourd'hui" : days === 1 ? 'Hier' : `Il y a ${days} jours`;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
