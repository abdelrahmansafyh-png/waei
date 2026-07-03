export const Colors = {
  primary: "var(--color-primary)",
  primaryDark: "var(--color-primary-dark)",
  sky: "var(--color-sky)",
  green: "var(--color-green)",
  purple: "var(--color-purple)",
  yellow: "var(--color-yellow)",
  text: "var(--color-text)",
  pageBg: "var(--color-background)",
} as const;

export const colors = {
  primary: Colors.primary,
  primaryDark: Colors.primaryDark,
  sky: Colors.sky,
  green: Colors.green,
  purple: Colors.purple,
  yellow: Colors.yellow,
  text: Colors.text,
  background: Colors.pageBg,
} as const;
