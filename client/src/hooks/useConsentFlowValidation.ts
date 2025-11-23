import { useState } from "react";
import type { ConsentFlowState } from "@/contexts/ConsentFlowContext";

export interface ValidationErrors {
  [key: number]: string;
}

export const useConsentFlowValidation = () => {
  const [partyErrors, setPartyErrors] = useState<ValidationErrors>({});

  const normalizeUsername = (input: string): string => {
    if (!input || input.trim() === '') return '';
    const trimmed = input.trim();
    
    // If starts with @, treat as PMY username - normalize to canonical format
    if (trimmed.startsWith('@')) {
      // Remove anything that's not @, alphanumeric, or underscore
      let normalized = trimmed.replace(/[^@a-zA-Z0-9_]/g, '');
      // Lowercase for canonical format
      normalized = normalized.toLowerCase();
      return normalized;
    }
    
    // Otherwise, treat as legal name - preserve as-is
    return trimmed;
  };

  const validateUsername = (input: string): string | null => {
    if (!input || input.trim() === '') return null;
    const trimmed = input.trim();
    
    // Two valid formats:
    // 1. PMY username: @alphanumeric_underscore only (lowercase)
    // 2. Legal name: any text without @ prefix
    
    if (trimmed.startsWith('@')) {
      // Validate PMY username format
      const usernameRegex = /^@[a-z0-9_]+$/;
      if (!usernameRegex.test(trimmed)) {
        return "PMY username must be @lowercase_letters_numbers_underscores";
      }
    } else {
      // Legal name - accept any non-empty text
      if (trimmed.length < 2) {
        return "Name must be at least 2 characters";
      }
    }
    
    return null;
  };

  const validateParty = (index: number, value: string): boolean => {
    const normalizedValue = normalizeUsername(value);
    const error = validateUsername(normalizedValue);
    
    setPartyErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[index] = error;
      } else {
        delete newErrors[index];
      }
      return newErrors;
    });
    
    return !error;
  };

  const clearPartyError = (index: number) => {
    setPartyErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const reindexErrors = (removedIndex: number) => {
    setPartyErrors(prev => {
      const newErrors: ValidationErrors = {};
      Object.entries(prev).forEach(([key, value]) => {
        const numKey = parseInt(key);
        if (numKey < removedIndex) {
          newErrors[numKey] = value;
        } else if (numKey > removedIndex) {
          newErrors[numKey - 1] = value;
        }
      });
      return newErrors;
    });
  };

  const canSaveDraft = (state: ConsentFlowState, currentStep: number): boolean => {
    // Can save draft once step 1 (encounter type) is complete
    if (currentStep < 1) return false;
    
    // Encounter type must be selected
    if (!state.encounterType) return false;
    
    return true;
  };

  const canSaveOrShare = (state: ConsentFlowState): boolean => {
    // All steps must be complete
    if (!state.encounterType) return false;
    if (!state.method) return false;
    
    // If encounter type requires parties, validate them
    const validParties = state.parties.filter(p => {
      const trimmed = p.trim();
      return trimmed !== "" && validateUsername(trimmed) === null;
    });
    
    if (validParties.length < 2) return false;
    
    return true;
  };

  return {
    partyErrors,
    normalizeUsername,
    validateUsername,
    validateParty,
    clearPartyError,
    reindexErrors,
    canSaveDraft,
    canSaveOrShare,
  };
};
