'use client';

const KYOTEN_OPTIONS = [
  { value: '', label: '全拠点' },
  { value: 'sapporo', label: '札幌' },
  { value: 'iwaki', label: 'いわき' },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function KyotenFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {KYOTEN_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            value === opt.value
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
