// src/lib/api/resumeApi.ts
import apiClient from "./apiClient";
import { ApiResponse } from "@/types/api/ApiResponse";
import { ResumeUploadResponse } from "@/types/user/ResumeUpload";
import { User } from "@/types/user/User";

/**
 * Resume/CV API service
 */
export class ResumeApi {
  private static BASE_PATH = "/curriculo";

  /**
   * Upload resume/CV file
   *
   * @param file PDF file to upload
   * @returns ApiResponse with extracted data
   */
  public static async uploadResume(
    file: File
  ): Promise<ApiResponse<ResumeUploadResponse>> {
    // Create form data
    const formData = new FormData();
    formData.append("curriculo", file);

    // Custom config for multipart/form-data
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    try {
      const response = await apiClient.post<ResumeUploadResponse>(
        `${this.BASE_PATH}/upload`,
        formData,
        config
      );

      return response;
    } catch (error) {
      console.error("Error uploading resume:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Unknown error uploading resume",
        status: 500,
      };
    }
  }

  /**
   * Get user profile with resume data
   *
   * @param userId User ID
   * @returns ApiResponse with user data including resume
   */
  public static async getUserWithResume(
    userId: string
  ): Promise<ApiResponse<User>> {
    try {
      // This would need to be implemented on the backend
      // Assuming there's an endpoint to get user data including resume
      const response = await apiClient.get<User>(`/usuario/${userId}`);

      return response;
    } catch (error) {
      console.error("Error fetching user resume data:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Unknown error fetching resume data",
        status: 500,
      };
    }
  }

  /**
   * Update user resume/profile data
   *
   * @param userId User ID
   * @param userData Updated user data
   * @returns ApiResponse with updated user data
   */
  public static async updateUserResume(
    userId: string,
    userData: Partial<User>
  ): Promise<ApiResponse<User>> {
    try {
      // This would need to be implemented on the backend
      // Assuming there's an endpoint to update user profile/resume data
      const response = await apiClient.put<User>(
        `/usuario/${userId}`,
        userData
      );

      return response;
    } catch (error) {
      console.error("Error updating resume data:", error);
      return {
        erro:
          error instanceof Error
            ? error.message
            : "Unknown error updating resume data",
        status: 500,
      };
    }
  }
}

export default ResumeApi;
