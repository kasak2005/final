// API service for communicating with the Flask backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Save personal information
  async savePersonalInfo(personalInfo: any, avatarFile?: File): Promise<ApiResponse> {
    const formData = new FormData();
    
    // Add personal info fields
    Object.keys(personalInfo).forEach(key => {
      if (personalInfo[key] !== null && personalInfo[key] !== undefined) {
        formData.append(key, personalInfo[key]);
      }
    });

    // Add avatar file if provided
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    return fetch(`${API_BASE_URL}/save-personal-info`, {
      method: 'POST',
      body: formData,
    }).then(response => response.json());
  }

  // Submit interview response
  async submitResponse(responseData: {
    interview_id: string;
    question: string;
    user_answer: string;
    created_at: string;
    duration: number;
  }): Promise<ApiResponse> {
    return this.request('/submit-response', {
      method: 'POST',
      body: JSON.stringify(responseData),
    });
  }

  // Generate questions
  async generateQuestions(jobDescription: string): Promise<ApiResponse> {
    return this.request('/generate_question', {
      method: 'POST',
      body: JSON.stringify({ job_description: jobDescription }),
    });
  }

  // Text to speech
  async textToSpeech(text: string, lang: string = 'en'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, lang }),
    });

    if (!response.ok) {
      throw new Error('TTS request failed');
    }

    return response.blob();
  }

  // Speech to text
  async speechToText(audioBlob: Blob): Promise<ApiResponse<{ text: string }>> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');

    return fetch(`${API_BASE_URL}/stt`, {
      method: 'POST',
      body: formData,
    }).then(response => response.json());
  }

  // Save job description
  async saveJobDescription(jobData: {
    job_title: string;
    company_name: string;
    experience_level: string;
    interview_type: string;
    job_description: string;
    requirements: string;
  }): Promise<ApiResponse> {
    return this.request('/job_description', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  // Evaluate all answers
  async evaluateAllAnswers(interviewId: string): Promise<ApiResponse> {
    return this.request('/evaluate_all_answer', {
      method: 'POST',
      body: JSON.stringify({ interview_id: interviewId }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;