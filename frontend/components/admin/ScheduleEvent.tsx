"use client";

import React from "react";
import { ArrowRight, CalendarCheck, Info } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { Button, Card, Eyebrow, PageTitle } from "@/components/ui/primitives";
import { ManualDrawer } from "@/components/spectra/SpectraBoard";

/** Admin: book an event in a room directly, without going through the venue request screens. The same rules apply. */
export function ScheduleEvent({ onOpenBoard }: { onOpenBoard: () => void }) {
  const { user } = useApp();
  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Schedule" title={<>Book a room, <span className="italic font-medium text-gold">directly</span></>}
        subtitle="Choose the room, the day and the hours. Every hard rule is checked first: a room that is taken, too small, closed, or missing what the event needs is refused with the reason, and nothing is booked."
        actions={<Button variant="secondary" icon={<ArrowRight className="w-4 h-4" />} onClick={onOpenBoard}>See the venue board</Button>} />
      <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 items-start">
        <ManualDrawer inline onClose={() => undefined} canAutoBook={user.role === "admin"} />
        <div className="space-y-4">
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-lagoon-700" /><h3 className="font-display text-xl font-semibold">What happens next</h3></div>
            <ul className="text-sm text-ink-600 space-y-1.5 list-disc pl-5">
              <li>A valid ordinary event is booked at once and shows on the venue board and in the room timetable.</li>
              <li>An institute event that needs a class moved for Week 7 is not applied automatically: you get the suggested shifting with the reason for each move, and nothing moves until you accept it in Approvals.</li>
              <li>Your category is capped by your role, and an event cannot take a slot an earlier or higher-priority request already holds.</li>
            </ul>
          </Card>
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2"><Info className="w-4 h-4 text-lagoon-700" /><Eyebrow>Not sure which room is free?</Eyebrow></div>
            <p className="text-sm text-ink-600">Press the button above to open the venue board, or use &ldquo;Is a room free?&rdquo; on the Overview page: pick the day, the hours and the seats and it lists the free rooms.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
