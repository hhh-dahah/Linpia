import type { SupabaseClient } from "@supabase/supabase-js";

function getExtension(file: File) {
  if (file.type.includes("webp")) {
    return "webp";
  }
  if (file.type.includes("png")) {
    return "png";
  }
  return "jpg";
}

export async function uploadImage({
  supabase,
  bucket,
  folder,
  file,
  ownerId,
}: {
  supabase: SupabaseClient;
  bucket: string;
  folder: string;
  file: File | null | undefined;
  ownerId: string;
}) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = getExtension(file);
  const path = `${folder}/${ownerId}.${extension}`;
  const buffer = await file.arrayBuffer();

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    upsert: true,
    contentType: file.type || "image/webp",
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
