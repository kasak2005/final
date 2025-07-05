import { useState, useCallback, useRef } from 'react';
import { InterviewSession, Question, InterviewResponse, InterviewResult, StudentInfo, JobDescription, AIBotState } from '../types';

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

  // Speech synthesis for AI bot
  const speak = useCallback((text: string) => {
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
  }, []);

  // Speech recognition for user responses
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

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAiBot(prev => ({ ...prev, isListening: false, currentEmotion: 'happy', isWaitingForResponse: false }));
      
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log('Audio recorded:', audioBlob);
        
        setTimeout(() => {
          setAiBot(prev => ({ 
            ...prev, 
            message: "Great response! I'm analyzing your answer. Let's move to the next question.",
            currentEmotion: 'happy'
          }));
        }, 1000);
      };
    }
  }, [isRecording]);

  // Dynamic question generation based on profile and job description
  const generateQuestions = useCallback((jobDescription: JobDescription, studentInfo?: StudentInfo): Question[] => {
    const questionPool = {
      hr: {
        intro: [
          `Hello! Welcome to your ${jobDescription.type} interview for the ${jobDescription.title} position at ${jobDescription.company}. Let's start with a simple question - tell me about yourself and why you're interested in this role.`,
          `Hi there! I'm excited to interview you for the ${jobDescription.title} position at ${jobDescription.company}. To begin, could you walk me through your background and what draws you to this opportunity?`,
          `Welcome! Thank you for your interest in the ${jobDescription.title} role at ${jobDescription.company}. Let's start by having you introduce yourself and explain your motivation for this position.`
        ],
        behavioral: [
          `What specifically attracts you to ${jobDescription.company}, and how do you see yourself contributing to our team?`,
          `Can you describe a challenging situation you faced in your previous experience and how you overcame it?`,
          `Tell me about a time when you had to work with a difficult team member. How did you handle the situation?`,
          `Describe a project where you had to learn something completely new. How did you approach the learning process?`,
          `What would you say are your greatest strengths, and can you provide a specific example of how these strengths helped you achieve a goal?`,
          `Tell me about a time when you failed at something. What did you learn from that experience?`,
          `How do you handle stress and pressure in the workplace?`,
          `Describe a situation where you had to make a difficult decision with limited information.`
        ],
        company: [
          `What do you know about ${jobDescription.company} and why do you want to work here specifically?`,
          `How do you think you would fit into ${jobDescription.company}'s culture?`,
          `What questions do you have about the ${jobDescription.title} role or ${jobDescription.company}?`
        ],
        future: [
          `Where do you see yourself in the next 3-5 years, and how does this position align with your career goals?`,
          `What are you looking for in your next role that you haven't found in previous positions?`,
          `How do you stay updated with industry trends and continue your professional development?`
        ]
      },
      technical: {
        intro: [
          `Hello! Welcome to your technical interview for the ${jobDescription.title} position at ${jobDescription.company}. Let's start by discussing your technical background and experience.`,
          `Hi! I'm here to assess your technical skills for the ${jobDescription.title} role at ${jobDescription.company}. Could you begin by telling me about your technical expertise?`
        ],
        technical: [
          `Walk me through your approach to solving a complex technical problem in your field. What tools and methodologies do you typically use?`,
          `Can you explain a recent project where you had to learn a new technology or framework? How did you approach the learning process?`,
          `Describe the most challenging technical problem you've solved. What made it difficult and how did you overcome it?`,
          `How do you ensure code quality and maintainability in your projects?`,
          `Tell me about a time when you had to optimize performance in an application. What was your approach?`,
          `How do you stay current with new technologies and best practices in your field?`,
          `Describe your experience with version control and collaborative development.`,
          `Walk me through how you would design a system to handle [relevant technical scenario for the role].`
        ],
        problem_solving: [
          `If you encountered a bug that you couldn't reproduce locally, how would you go about debugging it?`,
          `How would you approach scaling an application that's experiencing performance issues?`,
          `Describe your process for reviewing and improving existing code.`
        ]
      }
    };

    const selectedQuestions: Question[] = [];
    const type = jobDescription.type;
    const pool = questionPool[type];

    // Always start with an intro question
    const introQuestions = pool.intro;
    selectedQuestions.push({
      id: 'q-1',
      text: introQuestions[Math.floor(Math.random() * introQuestions.length)],
      type: 'behavioral',
      timeLimit: 120,
      difficulty: 'easy'
    });

    if (type === 'hr') {
      // Add behavioral questions
      const behavioralQuestions = pool.behavioral;
      for (let i = 0; i < 3; i++) {
        const randomQuestion = behavioralQuestions[Math.floor(Math.random() * behavioralQuestions.length)];
        selectedQuestions.push({
          id: `q-${selectedQuestions.length + 1}`,
          text: randomQuestion,
          type: 'behavioral',
          timeLimit: 150,
          difficulty: 'medium'
        });
      }

      // Add company-specific question
      const companyQuestions = pool.company;
      selectedQuestions.push({
        id: `q-${selectedQuestions.length + 1}`,
        text: companyQuestions[Math.floor(Math.random() * companyQuestions.length)],
        type: 'behavioral',
        timeLimit: 120,
        difficulty: 'medium'
      });

      // Add future-focused question
      const futureQuestions = pool.future;
      selectedQuestions.push({
        id: `q-${selectedQuestions.length + 1}`,
        text: futureQuestions[Math.floor(Math.random() * futureQuestions.length)],
        type: 'behavioral',
        timeLimit: 120,
        difficulty: 'medium'
      });
    } else {
      // Technical interview
      const technicalQuestions = pool.technical;
      for (let i = 0; i < 3; i++) {
        const randomQuestion = technicalQuestions[Math.floor(Math.random() * technicalQuestions.length)];
        selectedQuestions.push({
          id: `q-${selectedQuestions.length + 1}`,
          text: randomQuestion,
          type: 'technical',
          timeLimit: 240,
          difficulty: i === 0 ? 'medium' : 'hard'
        });
      }

      // Add problem-solving question
      const problemQuestions = pool.problem_solving;
      selectedQuestions.push({
        id: `q-${selectedQuestions.length + 1}`,
        text: problemQuestions[Math.floor(Math.random() * problemQuestions.length)],
        type: 'technical',
        timeLimit: 180,
        difficulty: 'hard'
      });
    }

    // Add experience-based questions if student info is available
    if (studentInfo?.experience) {
      selectedQuestions.push({
        id: `q-${selectedQuestions.length + 1}`,
        text: `I see you have experience in ${studentInfo.major}. Can you tell me about a specific project or experience that demonstrates your skills in this area?`,
        type: type === 'technical' ? 'technical' : 'behavioral',
        timeLimit: 150,
        difficulty: 'medium'
      });
    }

    // Add skill-based questions
    if (studentInfo?.skills && studentInfo.skills.length > 0) {
      const randomSkill = studentInfo.skills[Math.floor(Math.random() * studentInfo.skills.length)];
      selectedQuestions.push({
        id: `q-${selectedQuestions.length + 1}`,
        text: `I noticed you have experience with ${randomSkill}. Can you walk me through how you've used this skill in a real-world scenario?`,
        type: type === 'technical' ? 'technical' : 'behavioral',
        timeLimit: 180,
        difficulty: 'medium'
      });
    }

    return selectedQuestions.slice(0, 6); // Limit to 6 questions
  }, []);

  const startInterview = useCallback((studentInfo: StudentInfo, jobDescription: JobDescription) => {
    const questions = generateQuestions(jobDescription, studentInfo);
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

  const submitResponse = useCallback((questionId: string, answer: string, duration: number, audioBlob?: Blob) => {
    if (!currentSession) return;

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

  const completeInterview = useCallback((): InterviewResult | null => {
    if (!currentSession || currentSession.responses.length === 0) return null;

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