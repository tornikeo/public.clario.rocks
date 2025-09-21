"use client";
// TODO
// Event eards must appear in suspense as the Refresh button is hit
// Suspense animation must show dummy flickering placeholder gray lines
import React, { useEffect, useRef, useState } from 'react';
import type { Event } from "@prisma/client";
import TimeAgo from 'javascript-time-ago'

// English.
import en from 'javascript-time-ago/locale/en'

interface EventCardProps {
  event: Event;
}

TimeAgo.addDefaultLocale(en)

// Create formatter (English).
const timeAgo = new TimeAgo('en-US')

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 1000); // Simulate loading
    return () => clearTimeout(timeout);
  }, []);

  const time = event.time ? (typeof event.time === 'string' ? new Date(event.time) : event.time) : null;
  const formattedTime = time ? timeAgo.format(time) : 'Unknown time';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expanded) {
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const handleToggle = () => setExpanded((v) => !v);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const hostnameToSourceName: Record<string, string> = {
    "www.nytimes.com": "The New York Times",
    "www.bbc.com": "BBC",
    "www.theguardian.com": "The Guardian",
    // Add more mappings as needed
  };

  const getSourceName = (url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      return hostnameToSourceName[hostname] ?? hostname; // Use hostname as fallback
    } catch {
      return url; // If URL parsing fails, return the full URL
    }
  };

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`border rounded-lg shadow-md p-4 cursor-pointer transition-all ${event.id}`}
    >
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold mb-2">{event.title}</h2>

          {/* show summary when collapsed, content when expanded */}
          {!expanded ? (
            <p className="text-gray-700 mb-2">{event.summary}</p>
          ) : (
            <div className="text-gray-800 mb-2 whitespace-pre-wrap">{event.content}</div>
          )}

          <div className="text-sm text-gray-500 mb-2">
            Time: <time dateTime={time ? time.toISOString() : undefined} title={time ? time.toLocaleString() : 'Unknown time'}>{formattedTime}</time>
          </div>

          {event.url_sources && event.url_sources.length > 0 && (
            <div className="mt-2">
              <h3 className="font-semibold text-sm mb-1">Sources</h3>
              <ul className="list-disc list-inside">
                {event.url_sources.map((u, idx) => (
                  <li key={idx}>
                    <a
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} // prevent toggling when following links
                      className="text-blue-600 hover:underline break-all"
                    >
                      {getSourceName(u)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="mt-3">
              {event.tags.map((tag) => (
                <span key={tag} className="inline-block bg-gray-200 text-xs px-2 py-1 rounded mr-2">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventCard;