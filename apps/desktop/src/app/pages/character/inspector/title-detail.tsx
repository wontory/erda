import type { CharacterItemEquipmentTitle } from "@erda/api/generated/model";

export function TitleDetail({ title }: { title: CharacterItemEquipmentTitle }) {
  return (
    <div>
      <div className="font-semibold">{title.title_name}</div>
      {title.title_shape_name && title.title_shape_name !== title.title_name ? (
        <div className="text-muted-foreground">외형: {title.title_shape_name}</div>
      ) : null}
      <div className="mt-1">{title.title_description}</div>
    </div>
  );
}
