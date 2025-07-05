import { useState, useCallback, useRef } from 'react';
import { InterviewSession, Question, InterviewResponse, InterviewResult, StudentInfo, JobDescription, AIBotState } from '../types';
import { apiService } from '../services/api';

export const useInterview = () => {
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [aiBot, setAiBot] = useState<AIBotState>({
    isListening: false,
    isSpeaking: false,
    currentEmotion: 'neutral',
    message: 'Hello! I\'m your AI interviewer. Ready to begin?',
    isWaitingForResponse: false
  });
  const [isRecording, setIsRecording] = useState(false);
  const [interviewStartTime, setInterviewStartTime] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);

  // Enhanced speech synthesis with backend TTS
  const speak = useCallback(async (text: string) => {
    try {
      // Try backend TTS first
      const audioBlob = await apiService.textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setAiBot(prev => ({ ...prev, isSpeaking: true, message: text, isWaitingForResponse: false }));
      
      audio.onended = () => {
        setAiBot(prev => ({ ...prev, isSpeaking: false, isWaitingForResponse: true }));
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.warn('Backend TTS failed, falling back to browser TTS:', error);
      
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        
        setAiBot(prev => ({ ...prev, isSpeaking: true, message: text, isWaitingForResponse: false }));
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        
        utterance.onend = () => {
          setAiBot(prev => ({ ...prev, isSpeaking: false, isWaitingForResponse: true }));
        };
        
        speechSynthesis.speak(utterance);
      }
    }
  }, []);

  // Enhanced speech recognition with backend STT
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAiBot(prev => ({ ...prev, isListening: true, currentEmotion: 'thinking', isWaitingForResponse: false }));

      // Try browser speech recognition for real-time feedback
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setAiBot(prev => ({ 
              ...prev, 
              message: `I heard: "${finalTranscript}". Please continue or click stop when finished.`
            }));
          }
        };
        
        recognition.start();
        speechRecognitionRef.current = recognition;
      }
    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAiBot(prev => ({ ...prev, isListening: false, currentEmotion: 'happy', isWaitingForResponse: false }));
      
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        try {
          // Send audio to backend for transcription
          const response = await apiService.speechToText(audioBlob);
          if (response.success && response.data?.text) {
            setAiBot(prev => ({ 
              ...prev, 
              message: `I transcribed: "${response.data.text}". Great response! Let's move to the next question.`,
              currentEmotion: 'happy'
            }));
          }
        } catch (error) {
          console.error('Speech to text failed:', error);
          setAiBot(prev => ({ 
            ...prev, 
            message: "I recorded your response. Let's move to the next question.",
            currentEmotion: 'happy'
          }));
        }
      };
    }
  }, [isRecording]);

  // Generate questions using backend AI
  const generateQuestions = useCallback(async (jobDescription: JobDescription, studentInfo?: StudentInfo): Promise<Question[]> => {
    try {
      // Try to get AI-generated questions from backend
      const response = await apiService.generateQuestions(jobDescription.description);
      
      if (response.success && response.data?.questions) {
        // Convert backend response to frontend Question format
        return response.data.questions.map((q: any, index: number) => ({
          id: `ai-q-${index + 1}`,
          text: q.question || q.text || q,
          type: jobDescription.type === 'technical' ? 'technical' : 'behavioral',
          timeLimit: 180,
          difficulty: 'medium'
        }));
      }
    } catch (error) {
      console.warn('Backend question generation failed, using fallback:', error);
    }

    // Fallback to local question generation
    const questionPool = {
      hr: {
        intro: [
          `Hello! Welcome to your ${jobDescription.type} interview for the ${jobDescription.title} position at ${jobDescription.company}. Let's start with a simple question - tell me about yourself and why you're interested in this role.`,
          `Hi there! I'm excited to interview you for the ${jobDescription.title} position at ${jobDescription.company}. To begin, could you walk me through your background and what draws you to this opportunity?`,
        ],
        behavioral: [
          `What specifically attracts you to ${jobDescription.company}, and how do you see yourself contributing to our team?`,
          `Can you describe a challenging situation you faced in your previous experience and how you overcame it?`,
          `Tell me about a time when you had to work with a difficult team member. How did you handle the situation?`,
          `Describe a project where you had to learn something completely new. How did you approach the learning process?`,
          `What would you say are your greatest strengths, and can you provide a specific example of how these strengths helped you achieve a goal?`,
        ]
      },
      technical: {
        intro: [
          `Hello! Welcome to your technical interview for the ${jobDescription.title} position at ${jobDescription.company}. Let's start by discussing your technical background and experience.`,
        ],
        technical: [
          `Walk me through your approach to solving a complex technical problem in your field. What tools and methodologies do you typically use?`,
          `Can you explain a recent project where you had to learn a new technology or framework? How did you approach the learning process?`,
          `Describe the most challenging technical problem you've solved. What made it difficult and how did you overcome it?`,
          `How do you ensure code quality and maintainability in your projects?`,
          `Tell me about a time when you had to optimize performance in an application. What was your approach?`,
        ]
      }
    };

    const selectedQuestions: Question[] = [];
    const type = jobDescription.type;
    const pool = questionPool[type];

    // Generate questions from pool
    const introQuestions = pool.intro;
    selectedQuestions.push({
      id: 'q-1',
      text: introQuestions[Math.floor(Math.random() * introQuestions.length)],
      type: 'behavioral',
      timeLimit: 120,
      difficulty: 'easy'
    });

    const mainQuestions = type === 'hr' ? pool.behavioral : pool.technical;
    for (let i = 0; i < 5; i++) {
      const randomQuestion = mainQuestions[Math.floor(Math.random() * mainQuestions.length)];
      selectedQuestions.push({
        id: `q-${selectedQuestions.length + 1}`,
        text: randomQuestion,
        type: type === 'technical' ? 'technical' : 'behavioral',
        timeLimit: 180,
        difficulty: 'medium'
      });
    }

    return selectedQuestions;
  }, []);

  const startInterview = useCallback(async (studentInfo: StudentInfo, jobDescription: JobDescription) => {
    try {
      // Save student info to backend
      await apiService.savePersonalInfo({
        full_name: studentInfo.name,
        email: studentInfo.email,
        phone_number: studentInfo.phone,
        education_level: studentInfo.education,
        field_of_study: studentInfo.major,
        graduation_year: studentInfo.graduationYear,
        work_experience: studentInfo.experience,
        skills: studentInfo.skills.join(', ')
      });

      // Save job description to backend
      await apiService.saveJobDescription({
        job_title: jobDescription.title,
        company_name: jobDescription.company,
        experience_level: jobDescription.level,
        interview_type: jobDescription.type,
        job_description: jobDescription.description,
        requirements: jobDescription.requirements
      });
    } catch (error) {
      console.warn('Failed to save data to backend:', error);
    }

    const questions = await generateQuestions(jobDescription, studentInfo);
    const session: InterviewSession = {
      id: Math.random().toString(36).substr(2, 9),
      userId: studentInfo.userId || 'current-user',
      jobDescription,
      studentInfo,
      questions,
      responses: [],
      result: null,
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      duration: 0,
      currentQuestionIndex: 0
    };

    setCurrentSession(session);
    setCurrentQuestionIndex(0);
    setInterviewStartTime(Date.now());
    
    setTimeout(() => {
      speak(`Hello ${studentInfo.name}! I'm your AI interviewer today. I'll be conducting a comprehensive ${jobDescription.type} interview for the ${jobDescription.title} position. We'll have about 6 questions, and you can take your time to answer each one. Let's begin!`);
    }, 1000);

    return session;
  }, [generateQuestions, speak]);

  const submitResponse = useCallback(async (questionId: string, answer: string, duration: number, audioBlob?: Blob) => {
    if (!currentSession) return;

    try {
      // Submit response to backend for evaluation
      await apiService.submitResponse({
        interview_id: currentSession.id,
        question: currentSession.questions.find(q => q.id === questionId)?.text || '',
        user_answer: answer,
        created_at: new Date().toISOString(),
        duration
      });
    } catch (error) {
      console.warn('Failed to submit response to backend:', error);
    }

    // Local response processing for immediate feedback
    const responseLength = answer.length;
    const hasSpecificExamples = /example|instance|time when|experience|project|situation/i.test(answer);
    const hasQuantifiableResults = /\d+%|\d+ years?|\d+ people|\$\d+|increased|decreased|improved|achieved|delivered/i.test(answer);
    const hasRelevantKeywords = currentSession.jobDescription.requirements ? 
      new RegExp(currentSession.jobDescription.requirements.split(/[,\s]+/).slice(0, 5).join('|'), 'i').test(answer) : false;
    
    const keywords = answer.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const uniqueKeywords = [...new Set(keywords)];

    let confidence = Math.floor(Math.random() * 20) + 70;
    let clarity = Math.floor(Math.random() * 20) + 75;
    let relevanceScore = 60;
    
    if (responseLength > 100) confidence += 5;
    if (responseLength > 200) confidence += 5;
    if (hasSpecificExamples) {
      confidence += 10;
      relevanceScore += 15;
    }
    if (hasQuantifiableResults) {
      confidence += 8;
      relevanceScore += 10;
    }
    if (hasRelevantKeywords) {
      confidence += 7;
      relevanceScore += 12;
    }
    if (duration > 30 && duration < 180) clarity += 5;
    if (uniqueKeywords.length > 10) clarity += 5;
    
    confidence = Math.min(100, confidence);
    clarity = Math.min(100, clarity);
    relevanceScore = Math.min(100, relevanceScore);

    const emotionalTones = ['confident', 'nervous', 'enthusiastic', 'calm', 'passionate'];
    const emotionalTone = emotionalTones[Math.floor(Math.random() * emotionalTones.length)];

    const response: InterviewResponse = {
      questionId,
      answer,
      audioBlob,
      duration,
      confidence,
      clarity,
      emotionalTone,
      keywords: uniqueKeywords.slice(0, 10),
      relevanceScore
    };

    const updatedSession = {
      ...currentSession,
      responses: [...currentSession.responses, response]
    };

    setCurrentSession(updatedSession);
  }, [currentSession]);

  const nextQuestion = useCallback(() => {
    if (!currentSession) return false;
    
    if (currentQuestionIndex < currentSession.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      setTimeout(() => {
        const nextQuestion = currentSession.questions[nextIndex];
        speak(nextQuestion.text);
      }, 2000);
      
      return true;
    }
    return false;
  }, [currentSession, currentQuestionIndex, speak]);

  const stopInterview = useCallback(() => {
    if (!currentSession) return null;

    const stoppedSession = {
      ...currentSession,
      status: 'stopped' as const,
      duration: Math.floor((Date.now() - interviewStartTime) / 1000),
      completedAt: new Date().toISOString()
    };

    setCurrentSession(stoppedSession);
    speak("Interview stopped. Thank you for your time. You can review your responses and continue later if needed.");
    
    return stoppedSession;
  }, [currentSession, interviewStartTime, speak]);

  const completeInterview = useCallback(async (): Promise<InterviewResult | null> => {
    if (!currentSession || currentSession.responses.length === 0) return null;

    try {
      // Get final evaluation from backend
      const backendEvaluation = await apiService.evaluateAllAnswers(currentSession.id);
      console.log('Backend evaluation:', backendEvaluation);
    } catch (error) {
      console.warn('Backend evaluation failed:', error);
    }

    const responses = currentSession.responses;
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    const avgClarity = responses.reduce((sum, r) => sum + r.clarity, 0) / responses.length;
    const avgRelevance = responses.reduce((sum, r) => sum + (r.relevanceScore || 70), 0) / responses.length;
    const interviewDuration = Math.floor((Date.now() - interviewStartTime) / 1000);
    const completionRate = (responses.length / currentSession.questions.length) * 100;
    
    const technicalScore = currentSession.jobDescription.type === 'technical' ? 
      Math.floor(avgConfidence * 0.7 + avgRelevance * 0.3) : 
      Math.floor(Math.random() * 20) + 75;
    
    const communicationScore = Math.floor(avgClarity * 0.8 + avgConfidence * 0.2);
    const overallScore = Math.floor((avgConfidence + avgClarity + avgRelevance + completionRate) / 4);
    
    const result: InterviewResult = {
      overallScore,
      categoryScores: {
        communication: communicationScore,
        technical: technicalScore,
        confidence: Math.floor(avgConfidence),
        clarity: Math.floor(avgClarity),
        emotionalIntelligence: Math.floor(Math.random() * 25) + 70
      },
      responses,
      feedback: [
        "Your responses demonstrated good structure and thoughtfulness.",
        "You maintained professional composure throughout the interview.",
        avgRelevance > 80 ? "Your examples were highly relevant and well-articulated." : "Your examples were relevant and well-articulated.",
        currentSession.jobDescription.type === 'technical' ? 
          "Your technical knowledge appears solid for this role." :
          "Consider providing more quantified achievements in future interviews."
      ],
      recommendations: [
        "Practice the STAR method for behavioral questions",
        `Research more about ${currentSession.jobDescription.company}'s recent developments`,
        avgClarity < 80 ? "Work on reducing filler words for clearer communication" : "Continue maintaining clear communication",
        currentSession.jobDescription.type === 'technical' ? 
          "Continue building hands-on experience with relevant technologies" :
          "Prepare more specific examples of your achievements"
      ],
      strengths: [
        "Clear and articulate communication",
        "Professional demeanor and confidence",
        avgRelevance > 75 ? "Excellent use of relevant examples" : "Good use of relevant examples",
        currentSession.jobDescription.type === 'technical' ? 
          "Strong technical knowledge demonstration" :
          "Strong understanding of role requirements"
      ],
      areasForImprovement: [
        avgRelevance < 70 ? "Provide more specific and relevant examples" : "Could provide more quantified results",
        "Body language and eye contact",
        currentSession.jobDescription.type === 'technical' ? 
          "Explaining complex concepts more simply" :
          "Elaborating on leadership experiences",
        "Asking more insightful questions about the role"
      ],
      interviewDuration,
      completionRate,
      detailedAnalysis: {
        responseQuality: Math.floor(avgRelevance),
        technicalAccuracy: technicalScore,
        communicationSkills: communicationScore,
        problemSolvingAbility: Math.floor(avgConfidence * 0.8 + avgRelevance * 0.2)
      }
    };

    const completedSession = {
      ...currentSession,
      result,
      status: 'completed' as const,
      duration: interviewDuration,
      completedAt: new Date().toISOString()
    };

    setCurrentSession(completedSession);
    
    // Store interview in database for HR dashboard
    const interviews = JSON.parse(localStorage.getItem('interviews') || '[]');
    interviews.push(completedSession);
    localStorage.setItem('interviews', JSON.stringify(interviews));
    
    speak(`Excellent! We've completed the interview. You scored ${result.overallScore} out of 100. I'll now prepare your detailed feedback report. Thank you for your time!`);
    
    return result;
  }, [currentSession, interviewStartTime, speak]);

  const getCurrentQuestion = useCallback(() => {
    if (!currentSession) return null;
    return currentSession.questions[currentQuestionIndex] || null;
  }, [currentSession, currentQuestionIndex]);

  return {
    currentSession,
    currentQuestionIndex,
    aiBot,
    isRecording,
    startInterview,
    submitResponse,
    nextQuestion,
    stopInterview,
    completeInterview,
    getCurrentQuestion,
    startListening,
    stopListening,
    speak,
    questionsRemaining: currentSession ? currentSession.questions.length - currentQuestionIndex - 1 : 0,
    progress: currentSession ? ((currentQuestionIndex + 1) / currentSession.questions.length) * 100 : 0
  };
};