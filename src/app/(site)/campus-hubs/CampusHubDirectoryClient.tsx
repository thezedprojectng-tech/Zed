"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Building2, MapPin, ArrowRight, RotateCcw } from "lucide-react";
import type { CampusHub } from "@/lib/campus-hubs/types";
import { NIGERIAN_STATES } from "@/lib/campus-hubs/constants";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampusHubDirectoryClientProps {
  initialHubs: CampusHub[];
}

export function CampusHubDirectoryClient({ initialHubs }: CampusHubDirectoryClientProps) {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");

  const filteredHubs = useMemo(() => {
    return initialHubs.filter((hub) => {
      if (selectedState !== "all" && hub.state !== selectedState) {
        return false;
      }
      if (search.trim().length > 0) {
        const query = search.trim().toLowerCase();
        const matchName = hub.name.toLowerCase().includes(query);
        const matchState = hub.state.toLowerCase().includes(query);
        const matchSummary = hub.summary?.toLowerCase().includes(query) ?? false;
        if (!matchName && !matchState && !matchSummary) {
          return false;
        }
      }
      return true;
    });
  }, [initialHubs, search, selectedState]);

  const hasActiveFilters = search.trim().length > 0 || selectedState !== "all";

  const clearFilters = () => {
    setSearch("");
    setSelectedState("all");
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search universities by name or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm bg-card border-border"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-full sm:w-52">
            <Select
              value={selectedState}
              onValueChange={(val) => setSelectedState(val)}
            >
              <SelectTrigger className="w-full h-10 text-sm bg-card border-border">
                <SelectValue placeholder="Filter by State" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All States &amp; FCT</SelectItem>
                {NIGERIAN_STATES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Empty State: Zero hubs published at all */}
      {initialHubs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            No campus hubs published yet.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            University clearance, hostel accommodation, and departmental guides are being prepared by the Zed team. Check back shortly.
          </p>
        </div>
      )}

      {/* Empty State: Search or filter returned 0 items */}
      {initialHubs.length > 0 && filteredHubs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            No campus hubs found
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            No campus hubs match your search &quot;{search}&quot;
            {selectedState !== "all" ? ` in ${selectedState}` : ""}.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-xs mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Grid of Published Hubs */}
      {filteredHubs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredHubs.map((hub) => (
            <Link
              key={hub.id}
              href={`/campus-hubs/${hub.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-[#2E82F7]/50 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="font-mono text-[11px] gap-1 px-2 py-0.5 border-border bg-secondary/40 text-foreground font-medium"
                  >
                    <MapPin className="h-3 w-3 text-[#2E82F7]" />
                    <span>{hub.state}</span>
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Guide
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-bold font-display text-foreground group-hover:text-[#2E82F7] transition-colors leading-snug">
                    {hub.name}
                  </h2>
                  {hub.summary && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {hub.summary}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground">
                <span className="font-medium">Explore Campus Guide</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#2E82F7]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

