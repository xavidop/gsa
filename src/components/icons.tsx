import type { SVGProps } from 'react';
import { BrainCircuit, Upload } from 'lucide-react';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  slab: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
        <line x1="12" x2="12" y1="14" y2="22" />
        <line x1="5" x2="19" y1="14" y2="14" />
    </svg>
  ),
  centering: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="1" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M22 12h-2" />
      <path d="M4 12H2" />
      <path d="M19.07 4.93l-1.41 1.41" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 19.07l-1.41-1.41" />
      <path d="M6.34 6.34l-1.41-1.41" />
    </svg>
  ),
  corners: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 5H8a3 3 0 0 0-3 3v12" />
      <path d="M4 19V9a3 3 0 0 1 3-3h12" />
    </svg>
  ),
  edges: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 2v20" />
      <path d="M20 2v20" />
      <path d="M12 2v20" />
    </svg>
  ),
  surface: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 6l10-4 10 4" />
      <path d="M2 18l10 4 10-4" />
      <path d="M12 2v20" />
    </svg>
  ),
  brainCircuit: BrainCircuit,
  upload: Upload,
};
