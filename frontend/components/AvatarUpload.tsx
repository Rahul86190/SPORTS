"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Upload, Loader2, User2 } from "lucide-react";
import Image from "next/image";

interface AvatarUploadProps {
    userId: string;
    currentAvatarUrl?: string;
    onUpload: (url: string) => void;
}

export function AvatarUpload({ userId, currentAvatarUrl, onUpload }: AvatarUploadProps) {
    const supabase = createClient();
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("You must select an image to upload.");
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const filePath = `${userId}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

            if (data) {
                setAvatarUrl(data.publicUrl);
                onUpload(data.publicUrl);
            }

        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert("Error uploading avatar!");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-neutral-100 flex items-center justify-center">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <User2 className="w-12 h-12 text-neutral-300" />
                    )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Upload className="w-8 h-8 text-white" />}
                </div>

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
            </div>
            <p className="text-sm text-neutral-500">Tap to change photo</p>
        </div>
    );
}
