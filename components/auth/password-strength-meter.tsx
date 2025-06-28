'use client';

import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  onStrengthChange?: (strength: PasswordStrength) => void;
  showRequirements?: boolean;
}

interface PasswordStrength {
  score: number;
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  meetsPolicy: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    label: 'At least 12 characters',
    test: (password) => password.length >= 12
  },
  {
    label: 'Contains uppercase letter',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    label: 'Contains lowercase letter',
    test: (password) => /[a-z]/.test(password)
  },
  {
    label: 'Contains number',
    test: (password) => /[0-9]/.test(password)
  },
  {
    label: 'Contains special character',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
];

const strengthColors = {
  'very-weak': 'bg-red-600',
  'weak': 'bg-orange-600',
  'fair': 'bg-yellow-600',
  'good': 'bg-green-600',
  'strong': 'bg-green-700',
  'very-strong': 'bg-green-800'
};

const strengthLabels = {
  'very-weak': 'Very Weak',
  'weak': 'Weak',
  'fair': 'Fair',
  'good': 'Good',
  'strong': 'Strong',
  'very-strong': 'Very Strong'
};

export function PasswordStrengthMeter({
  password,
  onStrengthChange,
  showRequirements = true
}: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    level: 'very-weak',
    feedback: [],
    meetsPolicy: false
  });

  useEffect(() => {
    const calculateStrength = async () => {
      if (!password) {
        const emptyStrength: PasswordStrength = {
          score: 0,
          level: 'very-weak',
          feedback: [],
          meetsPolicy: false
        };
        setStrength(emptyStrength);
        onStrengthChange?.(emptyStrength);
        return;
      }

      // Calculate strength locally for immediate feedback
      let score = 0;
      const feedback: string[] = [];

      // Length score (max 30 points)
      const lengthScore = Math.min(30, password.length * 2);
      score += lengthScore;

      // Character diversity (max 40 points)
      let diversity = 0;
      if (/[a-z]/.test(password)) diversity++;
      if (/[A-Z]/.test(password)) diversity++;
      if (/[0-9]/.test(password)) diversity++;
      if (/[^a-zA-Z0-9]/.test(password)) diversity++;
      score += diversity * 10;

      // Pattern penalties
      if (/(.)\1{2,}/.test(password)) {
        score -= 10;
        feedback.push('Avoid repeating characters');
      }

      if (hasSequentialPatterns(password)) {
        score -= 10;
        feedback.push('Avoid sequential patterns');
      }

      // Common patterns penalty
      if (hasCommonPatterns(password)) {
        score -= 15;
        feedback.push('Avoid common patterns');
      }

      // Ensure score is between 0 and 100
      score = Math.max(0, Math.min(100, score));

      // Determine level
      let level: PasswordStrength['level'];
      if (score < 20) level = 'very-weak';
      else if (score < 40) level = 'weak';
      else if (score < 60) level = 'fair';
      else if (score < 80) level = 'good';
      else if (score < 95) level = 'strong';
      else level = 'very-strong';

      // Check if all requirements are met
      const meetsAllRequirements = requirements.every(req => req.test(password));

      const newStrength: PasswordStrength = {
        score,
        level,
        feedback,
        meetsPolicy: meetsAllRequirements && score >= 60
      };

      setStrength(newStrength);
      onStrengthChange?.(newStrength);
    };

    calculateStrength();
  }, [password, onStrengthChange]);

  const hasSequentialPatterns = (pwd: string): boolean => {
    const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz'];
    const lowerPwd = pwd.toLowerCase();
    
    for (const seq of sequences) {
      for (let i = 0; i < lowerPwd.length - 2; i++) {
        const substr = lowerPwd.substring(i, i + 3);
        if (seq.includes(substr)) return true;
      }
    }
    return false;
  };

  const hasCommonPatterns = (pwd: string): boolean => {
    return /^[a-zA-Z]+[0-9]+$/.test(pwd) || /^[0-9]+[a-zA-Z]+$/.test(pwd);
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Strength meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Password strength:</span>
          <span className={cn(
            "font-medium",
            strength.level === 'very-weak' && "text-red-600",
            strength.level === 'weak' && "text-orange-600",
            strength.level === 'fair' && "text-yellow-600",
            strength.level === 'good' && "text-green-600",
            strength.level === 'strong' && "text-green-700",
            strength.level === 'very-strong' && "text-green-800"
          )}>
            {strengthLabels[strength.level]}
          </span>
        </div>
        <Progress
          value={strength.score}
          className="h-2"
          indicatorClassName={strengthColors[strength.level]}
        />
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="space-y-1">
          {requirements.map((req, index) => {
            const isMet = req.test(password);
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  isMet ? "text-green-600" : "text-gray-500"
                )}
              >
                {isMet ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span>{req.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback messages */}
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((message, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-yellow-600"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Overall status */}
      {password.length >= 12 && (
        <div className={cn(
          "text-sm font-medium text-center py-2 px-3 rounded-md",
          strength.meetsPolicy
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-yellow-50 text-yellow-700 border border-yellow-200"
        )}>
          {strength.meetsPolicy
            ? "Password meets all security requirements"
            : "Password does not meet all security requirements"}
        </div>
      )}
    </div>
  );
}