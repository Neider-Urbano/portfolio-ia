import { z } from "zod";
import { GalleryItem } from "@portafolio/models";
import type { ToolDefinition } from "./types";

const inputSchema = {
  tag: z.string().optional().describe("Filtra imágenes por etiqueta (ej: 'conferencias', 'hackathon')."),
  limit: z.number().int().min(1).max(30).optional(),
};

export const getGalleryTool: ToolDefinition<typeof inputSchema> = {
  name: "get_gallery",
  description:
    "Obtiene ítems de la galería de fotos (eventos, charlas, equipo, etc.) con su descripción y etiquetas. Úsala cuando el visitante pregunte por fotos, eventos o participación en conferencias.",
  inputSchema,
  handler: async ({ tag, limit }) => {
    const query = tag ? { tags: { $regex: new RegExp(tag, "i") } } : {};
    const items = await GalleryItem.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(limit ?? 15)
      .lean();

    return {
      count: items.length,
      items: items.map((i) => ({
        title: i.title,
        imageUrl: i.imageUrl,
        caption: i.caption,
        tags: i.tags,
      })),
    };
  },
};
