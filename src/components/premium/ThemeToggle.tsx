import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Modo claro" : "Modo escuro"}
      className="press grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition hover:bg-accent hover:text-foreground"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}