'use client';

import type { Jigyosho } from '@/lib/types';
import { googleMapsUrl } from '@/lib/master-api';

interface Props {
  jigyosho: Jigyosho;
}

export function ActionButtons({ jigyosho: j }: Props) {
  const actions = [
    {
      label: '電話',
      href: j.TEL ? `tel:${j.TEL.replace(/[-\s]/g, '')}` : null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      label: 'マップ',
      href: googleMapsUrl(j),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      label: 'メール',
      href: j.eメール ? `mailto:${j.eメール}` : null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      label: 'FAX',
      href: j.FAX ? `tel:${j.FAX.replace(/[-\s]/g, '')}` : null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      ),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((a) =>
        a.href ? (
          <a
            key={a.label}
            href={a.href}
            target={a.label === 'マップ' ? '_blank' : undefined}
            rel={a.label === 'マップ' ? 'noopener noreferrer' : undefined}
            className={`btn-action flex flex-col items-center justify-center gap-1 rounded-xl text-white py-3 transition ${a.color}`}
          >
            {a.icon}
            <span className="text-xs font-medium">{a.label}</span>
          </a>
        ) : (
          <div
            key={a.label}
            className="btn-action flex flex-col items-center justify-center gap-1 rounded-xl bg-gray-200 text-gray-400 py-3"
          >
            {a.icon}
            <span className="text-xs">{a.label}</span>
          </div>
        )
      )}
    </div>
  );
}
