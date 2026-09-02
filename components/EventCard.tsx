"use client";

import { Bookmark, ExternalLink, ThumbsDown } from "lucide-react";
import type { EventItem } from "@/lib/types";

export default function EventCard({ event }: { event: EventItem }) {
  return (
    <article className="eventCard">
      <div className="eventTopline">
        <span className={`score score-${event.score >= 90 ? "critical" : event.score >= 75 ? "high" : "normal"}`}>{event.score}</span>
        <span className="importance">{event.importance}</span>
        <span className="category">{event.category}</span>
        {event.demo && <span className="demoBadge">DEMO</span>}
        <span className="date">{event.date}</span>
      </div>
      <h3>{event.title}</h3>
      <div className="factBlock"><strong>FAKTA / KÄLLUNDERLAG</strong><p>{event.summary}</p></div>
      <div className="analysisBlock"><strong>BEVAKLYS BEDÖMNING</strong><p>{event.whyItMatters}</p></div>
      <div className="eventMeta">
        <span>{event.geography}</span><span>•</span><span>{event.sourceCount} {event.sourceCount === 1 ? "källa" : "källor"}</span><span>•</span><span>{event.primarySource}</span>
      </div>
      <div className="cardActions">
        <button className="primaryButton">Läs analys <ExternalLink size={15}/></button>
        <button><Bookmark size={16}/> Spara</button>
        <button><ThumbsDown size={16}/> Inte relevant</button>
      </div>
    </article>
  );
}
