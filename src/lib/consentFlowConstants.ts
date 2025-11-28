import { Ionicons } from '@expo/vector-icons';

export type University = {
  id: string;
  name: string;
  state: string;
  titleIXInfo: string;
  titleIXUrl: string | null;
  lastUpdated: string;
  verifiedAt: string | null;
};

export interface UserContact {
  id: string;
  userId: string;
  contactUsername: string;
  nickname: string | null;
  createdAt: string;
}

export const intimateEncounterType = { 
  id: "intimate", 
  label: "Intimate Encounter", 
  icon: Ionicons 
};

export const encounterTypes = [
  { id: "date", label: "Date", icon: Ionicons },
  { id: "conversation", label: "Textual Matter", icon: Ionicons },
  { id: "medical", label: "Medical", icon: Ionicons },
  { id: "professional", label: "Professional", icon: Ionicons },
];

export const otherEncounterType = { 
  id: "other", 
  label: "Other", 
  icon: Ionicons 
};

export const encounterTypesRequiringUniversity = ["intimate", "date"];

export const doesEncounterTypeRequireUniversity = (encounterType: string): boolean => {
  return encounterTypesRequiringUniversity.includes(encounterType);
};

export const intimateActOptions = [
  "Touching/Caressing",
  "Kissing",
  "Manual Stimulation",
  "Oral Stimulation",
  "Oral Intercourse",
  "Penetrative Intercourse",
  "Photography/Video Recording",
  "Other Acts (Specify in Contract)",
];

export const recordingMethods = [
  { 
    id: "signature" as const, 
    label: "Contract Signature", 
    icon: Ionicons,
    description: "Digital signatures on consent contract"
  },
  { 
    id: "voice" as const, 
    label: "Voice Recording", 
    icon: Ionicons,
    description: "Record verbal consent from both parties"
  },
  { 
    id: "photo" as const, 
    label: "Dual Selfie", 
    icon: Ionicons,
    description: "Upload a photo showing mutual agreement"
  },
  { 
    id: "biometric" as const, 
    label: "Authenticate with TouchID/FaceID", 
    icon: Ionicons,
    description: "Cryptographic proof using device biometrics"
  },
];

export type RecordingMethod = typeof recordingMethods[number]["id"];

