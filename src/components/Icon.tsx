import type { SVGProps } from "react";

type IconName =
  | "alert"
  | "copy"
  | "external"
  | "folder"
  | "pencil"
  | "power"
  | "refresh"
  | "search"
  | "server"
  | "settings"
  | "shield"
  | "square"
  | "x";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

const paths: Record<IconName, string[]> = {
  alert: ["M12 3 2.8 19h18.4L12 3Z", "M12 8v5", "M12 16.5v.1"],
  copy: ["M8 8h10v12H8z", "M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"],
  external: ["M7 7h10v10", "M10 6h8v8", "M18 6 7 17", "M5 10v9h9"],
  folder: ["M3 6h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"],
  pencil: ["M4 17.5V21h3.5L19.8 8.7l-3.5-3.5L4 17.5Z", "M14.8 6.7l3.5 3.5"],
  power: ["M12 3v9", "M7 6.5a8 8 0 1 0 10 0"],
  refresh: [
    "M20 6v5h-5",
    "M4 18v-5h5",
    "M18 9a7 7 0 0 0-11.8-2.2L4 9",
    "M6 15a7 7 0 0 0 11.8 2.2L20 15"
  ],
  search: ["M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z", "M16 16l5 5"],
  server: ["M4 5h16v6H4z", "M4 13h16v6H4z", "M7 8h.1", "M7 16h.1"],
  settings: [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    "M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 3.1-.2-.1a1.7 1.7 0 0 0-1.9-.1 8 8 0 0 1-1.5.9 1.7 1.7 0 0 0-1.1 1.5v.2H10.7v-.2a1.7 1.7 0 0 0-1.1-1.5 8 8 0 0 1-1.5-.9 1.7 1.7 0 0 0-1.9.1l-.2.1-1.8-3.1.1-.1A1.7 1.7 0 0 0 4.6 15 8 8 0 0 1 4.5 12c0-.5.1-1 .2-1.5a1.7 1.7 0 0 0-.3-1.9l-.1-.1L6 5.4l.2.1a1.7 1.7 0 0 0 1.9.1 8 8 0 0 1 1.5-.9 1.7 1.7 0 0 0 1.1-1.5V3h2.6v.2a1.7 1.7 0 0 0 1.1 1.5c.5.2 1 .5 1.5.9a1.7 1.7 0 0 0 1.9-.1l.2-.1 1.8 3.1-.1.1a1.7 1.7 0 0 0-.3 1.9c.1.5.2 1 .2 1.5s-.1 1-.2 1.5Z"
  ],
  shield: ["M12 3 5 6v5c0 4.5 2.8 8.4 7 10 4.2-1.6 7-5.5 7-10V6l-7-3Z", "M12 8v5", "M12 16.5v.1"],
  square: ["M6 6h12v12H6z"],
  x: ["M7 7l10 10", "M17 7 7 17", "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"]
};

export default function Icon({ name, size = 14, ...props }: IconProps) {
  return (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={props["aria-hidden"] ?? true}
    >
      {paths[name].map((pathData, index) => (
        <path key={`${name}-${index}`} d={pathData} />
      ))}
    </svg>
  );
}
