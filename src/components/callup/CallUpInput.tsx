"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseCallUpText, type ParsedCallUpResult } from "@/lib/callup/parser";
import { toast } from "sonner";

interface CallUpInputProps {
  onParsed: (result: ParsedCallUpResult) => void;
  hasSavedDetails: boolean;
  onViewSaved: () => void;
}

const SYNTHETIC_SAMPLE_LETTER = `NATIONAL YOUTH SERVICE CORPS
DIRECTORATE HEADQUARTERS, YAKUBU GOWON HOUSE, MAITAMA, ABUJA
CALL-UP LETTER FOR 2026 BATCH 'A' SERVICE YEAR

Call-up Number: NYSC/ABU/2026/142981
State Code: LA/26A/4912
Name: ADENIRAN BABAJIDE SAMUEL
State of Deployment: LAGOS
Orientation Camp: NYSC Permanent Orientation Camp, Iyana-Ipaja, Lagos State
Date of Reporting: 18th November, 2026
Batch: 2026 Batch A
Stream: Stream 1

Please ensure you report with your original certificates, medical fitness certificate from a Government Hospital, and required white outfits.`;

export function CallUpInput({
  onParsed,
  hasSavedDetails,
  onViewSaved,
}: CallUpInputProps) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    if (!text.trim()) {
      toast.error("Please paste your call-up letter text first");
      return;
    }
    const result = parseCallUpText(text);
    onParsed(result);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
      toast.error("Only .txt plain text files are supported in this version");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setText(content);
        toast.success(`Loaded ${file.name}`);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = "";
  };

  const loadSample = () => {
    setText(SYNTHETIC_SAMPLE_LETTER);
    toast.info("Sample synthetic call-up letter loaded");
  };

  return (
    <section className="space-y-6" aria-labelledby="parser-input-heading">
      {hasSavedDetails && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <BookmarkCheck className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                You have saved call-up details
              </p>
              <p className="text-xs text-muted-foreground">
                Your previously confirmed orientation details and packing list are saved locally.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewSaved}
            className="shrink-0"
          >
            View Saved Details
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      )}

      {/* Main card */}
      <div className="rounded-xl border border-hairline bg-card p-4 sm:p-6 space-y-4">
        <header className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2
              id="parser-input-heading"
              className="text-base font-medium text-foreground flex items-center gap-2"
            >
              <FileText className="h-4 w-4 text-primary" />
              Paste Letter Text
            </h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadSample}
                className="text-xs text-muted-foreground hover:text-foreground h-8"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" />
                Load Sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-8"
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload .txt
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={handleFileUpload}
                aria-label="Upload text file"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Copy the text from your letter and paste it here. No PDF or image/OCR parsing in this version.
          </p>
        </header>

        {/* Textarea */}
        <div>
          <label htmlFor="callup-textarea" className="sr-only">
            Call-up Letter Text
          </label>
          <textarea
            id="callup-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="NATIONAL YOUTH SERVICE CORPS&#10;CALL-UP LETTER FOR 2026 BATCH 'A'&#10;&#10;Name: ...&#10;Call-up Number: NYSC/...&#10;State Code: ...&#10;State of Deployment: ...&#10;Orientation Camp: ...&#10;Date of Reporting: ..."
            className="w-full rounded-lg border border-input bg-background/50 px-3.5 py-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Privacy notice banner */}
        <div className="flex items-start gap-2.5 rounded-lg border border-hairline bg-muted/30 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-medium text-foreground">
              Your letter text is processed on your device and is not uploaded.
            </span>
            <p>
              Parsing runs entirely in your local browser runtime. No text or data is ever transmitted to any server or remote database.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={handleParse}
            disabled={!text.trim()}
            className="w-full sm:w-auto font-medium"
          >
            Parse Letter
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
