import logoBlack from "../logo/logo_black.png";
import logoWhite from "../logo/logo_white.png";
import { useEditor } from "../store/useEditor.js";

/** Wordmark image — white on dark, black on light. */
export function LogoImage({ height = 22 }: { height?: number }) {
  const theme = useEditor((s) => s.theme);
  const src = theme === "dark" ? logoWhite : logoBlack;
  return (
    <img
      className="logo-image"
      src={src}
      alt="Nodal"
      height={height}
      style={{ height, width: "auto", display: "block" }}
    />
  );
}
