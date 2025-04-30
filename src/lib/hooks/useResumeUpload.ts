// src/lib/hooks/useResumeUpload.ts
import { useState } from "react";
import { ResumeApi } from "../api/resumeApi";
import { ResumeUploadResponse } from "@/types/user/ResumeUpload";

interface UseResumeUploadReturn {
  uploadResume: (file: File) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  uploadResponse: ResumeUploadResponse | null;
}

/**
 * Hook for handling resume/CV upload
 *
 * @returns Resume upload-related functions and state
 */
export const useResumeUpload = (): UseResumeUploadReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [uploadResponse, setUploadResponse] =
    useState<ResumeUploadResponse | null>(null);

  /**
   * Upload resume/CV file
   *
   * @param file PDF file to upload
   * @returns Promise that resolves to true if upload was successful
   */
  const uploadResume = async (file: File): Promise<boolean> => {
    // Validate file type
    if (file.type !== "application/pdf") {
      setError("O arquivo deve ser um PDF.");
      return false;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("O arquivo não pode exceder 5MB.");
      return false;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ResumeApi.uploadResume(file);

      if (response.status === 201 && response.data) {
        setSuccess(true);
        setUploadResponse(response.data);
        setIsLoading(false);
        return true;
      } else {
        setError(
          response.erro || "Erro ao fazer upload do currículo. Tente novamente."
        );
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao fazer upload do currículo"
      );
      setIsLoading(false);
      return false;
    }
  };

  return {
    uploadResume,
    isLoading,
    error,
    success,
    uploadResponse,
  };
};

export default useResumeUpload;
