import { Team } from "@/lib/matches";

// Bandera como imagen (flagcdn) para que se vea igual en todos los dispositivos.
// Windows no renderiza los emojis de bandera, por eso usamos imágenes.

export default function Flag({
  team,
  width = 26,
  className = "",
}: {
  team: Team;
  width?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${team.iso}.svg`}
      alt={team.name}
      title={team.name}
      width={width}
      style={{ width, height: "auto" }}
      loading="lazy"
      className={
        "inline-block shrink-0 rounded-[3px] ring-1 ring-black/10 " + className
      }
    />
  );
}
