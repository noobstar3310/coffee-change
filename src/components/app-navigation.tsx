"use client";

import { useState } from "react";
import { Dashboard } from "./dashboard";
import { RoundUpReview } from "./roundup-review";
import { InvestmentPosition } from "./investment-position";

type AppScreen = 'dashboard' | 'roundup-review' | 'investment-position';

export function AppNavigation() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');

  const navigateToScreen = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  const handleRoundUpReview = () => {
    navigateToScreen('roundup-review');
  };

  const handleInvestmentPosition = () => {
    navigateToScreen('investment-position');
  };

  const handleBackToDashboard = () => {
    navigateToScreen('dashboard');
  };

  const handleRoundUpSuccess = () => {
    navigateToScreen('investment-position');
  };

  switch (currentScreen) {
    case 'dashboard':
      return (
        <Dashboard 
          onReviewRoundUp={handleRoundUpReview}
          onViewPosition={handleInvestmentPosition}
        />
      );
    case 'roundup-review':
      return (
        <RoundUpReview 
          onBack={handleBackToDashboard}
          onSuccess={handleRoundUpSuccess}
        />
      );
    case 'investment-position':
      return (
        <InvestmentPosition 
          onBack={handleBackToDashboard}
        />
      );
    default:
      return <Dashboard onReviewRoundUp={handleRoundUpReview} onViewPosition={handleInvestmentPosition} />;
  }
}

