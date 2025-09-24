'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import WelcomeModal from './WelcomeModal';
import GuidedTour from './GuidedTour';

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentStep: number;
  startOnboarding: () => void;
  nextStep: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check if this is the first visit
    const hasCompletedOnboarding = localStorage.getItem('orion-onboarding-completed');
    if (!hasCompletedOnboarding) {
      setShowWelcomeModal(true);
    }
  }, []);

  const startOnboarding = () => {
    setShowWelcomeModal(false);
    setIsOnboardingActive(true);
    setCurrentStep(1);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const completeOnboarding = () => {
    setIsOnboardingActive(false);
    setCurrentStep(0);
    localStorage.setItem('orion-onboarding-completed', 'true');
  };

  const skipOnboarding = () => {
    setShowWelcomeModal(false);
    setIsOnboardingActive(false);
    localStorage.setItem('orion-onboarding-completed', 'true');
  };

  const value = {
    isOnboardingActive,
    currentStep,
    startOnboarding,
    nextStep,
    completeOnboarding,
    skipOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {showWelcomeModal && <WelcomeModal />}
      {isOnboardingActive && <GuidedTour />}
    </OnboardingContext.Provider>
  );
};

export default OnboardingProvider;