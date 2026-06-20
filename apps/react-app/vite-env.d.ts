/// <reference types="vite/client" />

declare module '@takeoff-icons/sprite' {
  const spriteUrl: string;
  export default spriteUrl;
}

declare namespace JSX {
  interface IntrinsicElements {
    'takeoff-icon': import('react').DetailedHTMLProps<
      import('react').HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      icon?: string;
      fill?: boolean;
      'icon-type'?: string;
      size?: string;
      variant?: string;
      color?: string;
    };
  }
}
