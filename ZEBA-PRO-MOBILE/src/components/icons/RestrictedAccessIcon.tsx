// RestrictedAccessIcon.tsx
import { ArrowUp } from 'lucide-react';
import React from 'react';

export const LockedFeatureIcon: React.FC = () => (
  <span
    className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 shadow-sm"
  >
    <ArrowUp className="w-4 h-4  sm:w-4 sm:h-4 text-white" strokeWidth={2} />
  </span>
);