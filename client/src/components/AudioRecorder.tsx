import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type RecordingState = "idle" | "recording" | "paused" | "stopped";

export default function AudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecordingState("recording");
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingState("stopped");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const date = new Date().toLocaleDateString().replace(/\//g, "-");
      setFilename(`consent-${date}.webm`);
    }
  };

  const downloadRecording = () => {
    if (audioURL) {
      const a = document.createElement("a");
      a.href = audioURL;
      a.download = filename || "consent-recording.webm";
      a.click();
      toast({
        title: "Download started",
        description: "Your recording has been saved.",
      });
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setRecordingState("idle");
    setRecordingTime(0);
    setFilename("");
    chunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {recordingState === "idle" && "Tap to start recording"}
              {recordingState === "recording" && "Recording in progress..."}
              {recordingState === "paused" && "Recording paused"}
              {recordingState === "stopped" && "Recording complete"}
            </p>
            <p className="text-4xl font-semibold tabular-nums" data-testid="text-recording-time">
              {formatTime(recordingTime)}
            </p>
          </div>

          {recordingState === "recording" && (
            <div className="w-full h-12 bg-muted rounded-lg flex items-center justify-center">
              <div className="flex gap-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 80 + 20}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {recordingState === "idle" && (
              <Button
                size="lg"
                onClick={startRecording}
                className="h-20 w-20 rounded-full"
                data-testid="button-start-recording"
              >
                <Mic className="h-8 w-8" />
              </Button>
            )}

            {recordingState === "recording" && (
              <>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={pauseRecording}
                  className="h-14 w-14 rounded-full"
                  data-testid="button-pause-recording"
                >
                  <Pause className="h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="h-14 w-14 rounded-full"
                  data-testid="button-stop-recording"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}

            {recordingState === "paused" && (
              <>
                <Button
                  size="lg"
                  onClick={resumeRecording}
                  className="h-14 w-14 rounded-full"
                  data-testid="button-resume-recording"
                >
                  <Mic className="h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="h-14 w-14 rounded-full"
                  data-testid="button-stop-recording"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {recordingState === "stopped" && audioURL && (
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="consent-recording.webm"
              data-testid="input-filename"
            />
          </div>

          <audio
            ref={audioRef}
            src={audioURL}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={togglePlayback}
              className="flex-1"
              data-testid="button-play-recording"
            >
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>
            <Button
              onClick={downloadRecording}
              className="flex-1"
              data-testid="button-download-recording"
            >
              <Download className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={deleteRecording}
            className="w-full"
            data-testid="button-delete-recording"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Discard
          </Button>
        </Card>
      )}
    </div>
  );
}
