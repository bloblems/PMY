import { Heart, Coffee, MessageCircle, Stethoscope, Briefcase, Users, FileSignature, Mic, Camera, Fingerprint } from "lucide-react";

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
  icon: Heart 
};

export const encounterTypes = [
  { id: "date", label: "Date", icon: Coffee },
  { id: "conversation", label: "Textual Matter", icon: MessageCircle },
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "professional", label: "Professional", icon: Briefcase },
];

export const otherEncounterType = { 
  id: "other", 
  label: "Other", 
  icon: Users 
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
    icon: FileSignature,
    description: "Digital signatures on consent contract"
  },
  { 
    id: "voice" as const, 
    label: "Voice Recording", 
    icon: Mic,
    description: "Record verbal consent from both parties"
  },
  { 
    id: "photo" as const, 
    label: "Dual Selfie", 
    icon: Camera,
    description: "Upload a photo showing mutual agreement"
  },
  { 
    id: "biometric" as const, 
    label: "Authenticate with TouchID/FaceID", 
    icon: Fingerprint,
    description: "Cryptographic proof using device biometrics"
  },
];

export type RecordingMethod = typeof recordingMethods[number]["id"];
