'use client';

import Link from 'next/link';
import type { Jigyosho } from '@/lib/types';
import { buildAddress } from '@/lib/master-api';

interface Props {
  jigyosho: Jigyosho;
}

export function JigyoshoCard({ jigyosho: j }: Props) {
  const address = buildAddress(j);

  return (
    <Link
      href={`/jigyosho/${encodeURIComponent(j.id)}`}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm text-gray-900 truncate">{j.名称}</h3>
          {j.正式名称 && j.正式名称 !== j.名称 && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{j.正式名称}</p>
          )}
        </div>
        {j.事業所番号 && (
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {j.事業所番号}
          </span>
        )}
      </div>
      {address && (
        <p className="mt-2 text-xs text-gray-600 truncate">{address}</p>
      )}
      <div className="mt-2 flex items-center gap-4">
        {j.TEL && (
          <span className="text-xs text-[var(--color-primary)] flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {j.TEL}
          </span>
        )}
      </div>
    </Link>
  );
}
