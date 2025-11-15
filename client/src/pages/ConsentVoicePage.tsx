import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Mic, Square, Play, Pause, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useConsentFlow } from "@/contexts/ConsentFlowContext";

export default function ConsentVoicePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { state, hasRequiredData, isHydrated } = useConsentFlow();
  
  // Defensive routing: redirect if required state is missing (after hydration)
  useEffect(() => {
    if (isHydrated && !hasRequiredData()) {
      toast({
        title: "Missing Information",
        description: "Please complete the consent flow from the beginning.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isHydrated, hasRequiredData, navigate, toast]);
  
  const { universityId, universityName, encounterType, parties, intimateActs } = state;

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startTime = useRef<number>(0);
  const timerInterval = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      startTime.current = Date.now();
      timerInterval.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime.current) / 1000));
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Speak your consent agreement clearly.",
      });
    } catch (error) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record consent.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      toast({
        title: "Recording Stopped",
        description: `Recorded ${duration} seconds of audio.`,
      });
    }
  };

  const togglePlayback = () => {
    if (!audioPlayer.current || !audioUrl) return;

    if (isPlaying) {
      audioPlayer.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayer.current.play();
      setIsPlaying(true);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!audioBlob) throw new Error("No audio recording");

      const formData = new FormData();
      formData.append("audio", audioBlob, `consent-${Date.now()}.webm`);
      if (universityId) {
        formData.append("universityId", universityId);
      }
      formData.append("encounterType", encounterType);
      formData.append("parties", JSON.stringify(parties));
      formData.append("duration", duration.toString());

      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

      const headers: Record<string, string> = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch("/api/consent-recordings", {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload recording");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-recordings"] });
      toast({
        title: "Recording Saved",
        description: "Your voice consent has been saved successfully.",
      });
      navigate("/files");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Voice Recording</h1>
          <p className="text-sm text-muted-foreground">{universityName}</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <Mic className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold">Record Verbal Consent</h3>
            <p className="text-sm text-muted-foreground">
              Both parties should clearly state their consent on the recording.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg text-xs space-y-2">
            <p className="font-medium">Suggested script:</p>
            <p className="text-muted-foreground">
              "I, [Your Name], and [Partner Name], on {new Date().toLocaleDateString()}, 
              mutually consent to this {encounterType} encounter. We understand the Title IX 
              policies of {universityName} and affirm that this consent is freely given, 
              voluntary, and may be withdrawn at any time."
            </p>
          </div>

          {isRecording && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-3 bg-red-600/10 dark:bg-red-400/10 border-2 border-red-600 dark:border-red-400 rounded-full px-6 py-3">
                <div className="w-3 h-3 bg-red-600 dark:bg-red-400 rounded-full animate-pulse" />
                <span className="text-2xl font-mono font-bold text-red-600 dark:text-red-400">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          )}

          {audioUrl && !isRecording && (
            <>
              <audio
                ref={audioPlayer}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlayback}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <div className="flex-1">
                  <p className="text-sm font-medium">Recording Complete</p>
                  <p className="text-xs text-muted-foreground">Duration: {formatTime(duration)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioUrl(null);
                    setDuration(0);
                  }}
                  data-testid="button-delete-recording"
                >
                  Delete
                </Button>
              </div>
            </>
          )}

          <div className="flex gap-2">
            {!audioBlob && !isRecording && (
              <Button
                onClick={startRecording}
                className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500"
                data-testid="button-start-recording"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            )}
            {isRecording && (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex-1"
                data-testid="button-stop-recording"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}
            {audioBlob && !isRecording && (
              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={uploadMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500"
                data-testid="button-save-recording"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadMutation.isPending ? "Saving..." : "Save Recording"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
