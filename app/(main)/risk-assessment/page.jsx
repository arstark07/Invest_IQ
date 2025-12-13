"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Target,
  Clock,
  Wallet,
  BarChart3,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { getRiskProfile, submitRiskQuestionnaire } from "@/actions/risk-assessment";

// Risk questionnaire questions
const QUESTIONS = [
  {
    id: "investment_horizon",
    question: "What is your investment time horizon?",
    description: "How long do you plan to stay invested before needing the money?",
    icon: Clock,
    options: [
      { value: "less_than_1_year", label: "Less than 1 year", points: 1 },
      { value: "1_to_3_years", label: "1-3 years", points: 2 },
      { value: "3_to_5_years", label: "3-5 years", points: 3 },
      { value: "5_to_10_years", label: "5-10 years", points: 4 },
      { value: "more_than_10_years", label: "More than 10 years", points: 5 },
    ],
  },
  {
    id: "investment_goal",
    question: "What is your primary investment goal?",
    description: "What do you want to achieve with your investments?",
    icon: Target,
    options: [
      { value: "capital_preservation", label: "Preserve my capital with minimal risk", points: 1 },
      { value: "regular_income", label: "Generate regular income", points: 2 },
      { value: "balanced_growth", label: "Balanced growth and income", points: 3 },
      { value: "capital_growth", label: "Grow my capital over time", points: 4 },
      { value: "aggressive_growth", label: "Maximize growth, willing to take high risks", points: 5 },
    ],
  },
  {
    id: "loss_tolerance",
    question: "If your investment dropped 20% in a month, what would you do?",
    description: "This helps us understand your emotional response to market volatility.",
    icon: AlertCircle,
    options: [
      { value: "sell_all", label: "Sell everything immediately", points: 1 },
      { value: "sell_some", label: "Sell some to reduce risk", points: 2 },
      { value: "hold", label: "Hold and wait for recovery", points: 3 },
      { value: "buy_some", label: "Buy a little more at lower prices", points: 4 },
      { value: "buy_more", label: "Buy significantly more - great opportunity!", points: 5 },
    ],
  },
  {
    id: "income_stability",
    question: "How stable is your current income?",
    description: "Your income stability affects how much risk you can afford to take.",
    icon: Wallet,
    options: [
      { value: "very_unstable", label: "Very unstable / Variable income", points: 1 },
      { value: "somewhat_unstable", label: "Somewhat unstable", points: 2 },
      { value: "moderately_stable", label: "Moderately stable", points: 3 },
      { value: "stable", label: "Stable with some variation", points: 4 },
      { value: "very_stable", label: "Very stable / Salaried with job security", points: 5 },
    ],
  },
  {
    id: "investment_experience",
    question: "What is your investment experience?",
    description: "Understanding your experience helps us tailor recommendations.",
    icon: BarChart3,
    options: [
      { value: "none", label: "No experience - this is my first time", points: 1 },
      { value: "beginner", label: "Beginner - FDs and savings accounts only", points: 2 },
      { value: "intermediate", label: "Intermediate - Mutual funds, some stocks", points: 3 },
      { value: "advanced", label: "Advanced - Active stock trading, F&O basics", points: 4 },
      { value: "expert", label: "Expert - Complex instruments, derivatives", points: 5 },
    ],
  },
  {
    id: "emergency_fund",
    question: "Do you have an emergency fund?",
    description: "An emergency fund covering 6 months of expenses provides a safety net.",
    icon: Shield,
    options: [
      { value: "none", label: "No emergency fund", points: 1 },
      { value: "less_than_3_months", label: "Less than 3 months expenses", points: 2 },
      { value: "3_to_6_months", label: "3-6 months expenses", points: 3 },
      { value: "6_to_12_months", label: "6-12 months expenses", points: 4 },
      { value: "more_than_12_months", label: "More than 12 months expenses", points: 5 },
    ],
  },
  {
    id: "risk_preference",
    question: "Which statement best describes your risk preference?",
    description: "This final question summarizes your overall risk attitude.",
    icon: TrendingUp,
    options: [
      { value: "very_conservative", label: "I want to protect my money, even if returns are low", points: 1 },
      { value: "conservative", label: "I prefer stability with modest growth potential", points: 2 },
      { value: "moderate", label: "I want a balance between safety and growth", points: 3 },
      { value: "aggressive", label: "I'm okay with fluctuations for higher returns", points: 4 },
      { value: "very_aggressive", label: "I want maximum growth, volatility doesn't bother me", points: 5 },
    ],
  },
];

// Risk level descriptions
const RISK_LEVELS = {
  CONSERVATIVE: {
    label: "Conservative",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    description: "You prefer stability and capital preservation. Best suited for debt funds, FDs, and government securities.",
    allocation: "Equity: 20% | Debt: 60% | Gold: 10% | Cash: 10%"
  },
  MODERATELY_CONSERVATIVE: {
    label: "Moderately Conservative",
    color: "from-teal-500 to-green-500",
    bgColor: "bg-teal-50",
    textColor: "text-teal-700",
    description: "You want some growth with limited volatility. Hybrid funds and balanced portfolios suit you well.",
    allocation: "Equity: 35% | Debt: 50% | Gold: 10% | Cash: 5%"
  },
  MODERATE: {
    label: "Moderate",
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    description: "You're comfortable with balanced risk-reward. A diversified portfolio of equity and debt works best.",
    allocation: "Equity: 50% | Debt: 35% | Gold: 10% | Cash: 5%"
  },
  MODERATELY_AGGRESSIVE: {
    label: "Moderately Aggressive",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    description: "You can handle volatility for better returns. Equity-focused investments with some debt hedging.",
    allocation: "Equity: 65% | Debt: 25% | Gold: 7% | Cash: 3%"
  },
  AGGRESSIVE: {
    label: "Aggressive",
    color: "from-red-500 to-pink-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    description: "You seek maximum growth and can withstand significant volatility. Heavy equity exposure recommended.",
    allocation: "Equity: 80% | Debt: 12% | Gold: 5% | Cash: 3%"
  },
};

export default function RiskAssessmentPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [existingProfile, setExistingProfile] = useState(null);

  const { loading: profileLoading, fn: fetchProfile, data: profileData } = useFetch(getRiskProfile);
  const { loading: submitting, fn: submitAnswers, data: submitResult } = useFetch(submitRiskQuestionnaire);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profileData?.success && profileData?.profile) {
      setExistingProfile(profileData.profile);
    }
  }, [profileData]);

  useEffect(() => {
    if (submitResult?.success) {
      setResult(submitResult);
      setShowResult(true);
      toast.success("Risk assessment completed!");
    }
  }, [submitResult]);

  const handleAnswer = (questionId, value, points) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { value, points }
    }));
  };

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Submit questionnaire
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Calculate total score
    const totalPoints = Object.values(answers).reduce((sum, a) => sum + a.points, 0);
    const maxPoints = QUESTIONS.length * 5;
    const score = (totalPoints / maxPoints) * 10;

    // Prepare submission data
    const questionnaireData = {
      answers: Object.entries(answers).map(([questionId, data]) => ({
        questionId,
        answer: data.value,
        points: data.points
      })),
      totalScore: score
    };

    try {
      await submitAnswers(questionnaireData);
    } catch (error) {
      toast.error("Failed to submit assessment");
    }
  };

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;
  const currentQ = QUESTIONS[currentQuestion];
  const isAnswered = answers[currentQ?.id];
  const isLastQuestion = currentQuestion === QUESTIONS.length - 1;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  // Show existing profile with option to retake
  if (existingProfile && !showResult && Object.keys(answers).length === 0) {
    const riskInfo = RISK_LEVELS[existingProfile.riskLevel] || RISK_LEVELS.MODERATE;
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-0 shadow-xl">
          <CardHeader className={`bg-gradient-to-r ${riskInfo.color} text-white rounded-t-lg`}>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">Your Risk Profile</CardTitle>
                <CardDescription className="text-white/80">
                  Last assessed: {new Date(existingProfile.updatedAt).toLocaleDateString('en-IN')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className={`inline-block px-6 py-3 rounded-full ${riskInfo.bgColor} ${riskInfo.textColor} font-bold text-xl mb-4`}>
                {riskInfo.label}
              </div>
              <p className="text-gray-600 mb-4">{riskInfo.description}</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Recommended Asset Allocation</p>
                <p className="font-medium">{riskInfo.allocation}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Risk Score: {existingProfile.riskScore}/10</p>
                  <p className="text-sm text-blue-600">
                    Your investment recommendations are based on this profile. 
                    Retake the assessment if your circumstances have changed.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setExistingProfile(null)}
              >
                Retake Assessment
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500"
                onClick={() => router.push('/portfolio')}
              >
                View Portfolio
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show result after submission
  if (showResult && result) {
    const riskInfo = RISK_LEVELS[result.riskLevel] || RISK_LEVELS.MODERATE;
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className={`bg-gradient-to-r ${riskInfo.color} text-white p-8 text-center`}>
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Assessment Complete!</h1>
            <p className="text-white/80">We&apos;ve analyzed your responses</p>
          </div>
          
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <p className="text-gray-500 mb-2">Your Risk Profile</p>
              <div className={`inline-block px-8 py-4 rounded-full ${riskInfo.bgColor} ${riskInfo.textColor} font-bold text-2xl mb-4`}>
                {riskInfo.label}
              </div>
              <p className="text-gray-600 mb-6">{riskInfo.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-3xl font-bold text-gray-800">{result.riskScore?.toFixed(1)}</p>
                  <p className="text-sm text-gray-500">Risk Score (out of 10)</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-3xl font-bold text-gray-800">{QUESTIONS.length}</p>
                  <p className="text-sm text-gray-500">Questions Answered</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-500 mb-2">Recommended Asset Allocation</p>
                <p className="font-semibold text-gray-800">{riskInfo.allocation}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push('/wallet')}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Add Funds
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500"
                onClick={() => router.push('/portfolio')}
              >
                Start Investing
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show questionnaire
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            Risk Assessment
          </h1>
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {QUESTIONS.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white">
              {currentQ && <currentQ.icon className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{currentQ?.question}</CardTitle>
              <CardDescription>{currentQ?.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQ?.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(currentQ.id, option.value, option.points)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  answers[currentQ.id]?.value === option.value
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={answers[currentQ.id]?.value === option.value ? 'text-pink-700 font-medium' : 'text-gray-700'}>
                    {option.label}
                  </span>
                  {answers[currentQ.id]?.value === option.value && (
                    <CheckCircle2 className="h-5 w-5 text-pink-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentQuestion === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isAnswered || submitting}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : isLastQuestion ? (
                <>
                  Complete
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 border-0 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Why Risk Assessment?</p>
              <p className="text-sm text-blue-600">
                Understanding your risk tolerance helps us recommend investments that match your comfort level and financial goals. 
                Your answers are confidential and used only to personalize your experience.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
