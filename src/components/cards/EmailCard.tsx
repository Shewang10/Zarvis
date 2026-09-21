import React, { useState, useEffect } from 'react';
import { Mail, Send, ExternalLink, Inbox, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { EmailMessage } from '../../../server/tools/emailAndBrowser';

interface EmailCardProps {
  data: {
    actionExecuted?: string;
    status?: string;
    appLaunched?: string;
    webUrl?: string;
    inbox?: EmailMessage[];
    message?: string;
  };
}

export const EmailCard: React.FC<EmailCardProps> = ({ data }) => {
  const [inboxList, setInboxList] = useState<EmailMessage[]>(data.inbox || []);
  const [selectedMsg, setSelectedMsg] = useState<EmailMessage | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  // Automatically open Outlook in new tab if requested
  useEffect(() => {
    if (data.webUrl && data.status === 'opened') {
      try {
        window.open(data.webUrl, '_blank', 'noopener,noreferrer');
      } catch {
        // Popups might be blocked by browser
      }
    }
  }, [data.webUrl, data.status]);

  const handleLaunchOutlookWeb = () => {
    window.open('https://outlook.live.com/mail/', '_blank', 'noopener,noreferrer');
  };

  const handleLaunchOutlookApp = () => {
    // Attempt custom URI scheme for Outlook
    window.location.href = 'ms-outlook://';
  };

  const handleSendDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo) return;

    // Trigger mailto link for direct handoff
    const mailto = `mailto:${composeTo}?subject=${encodeURIComponent(composeSubject)}&body=${encodeURIComponent(composeBody)}`;
    window.open(mailto, '_blank');

    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
    }, 2000);
  };

  const handleMarkAsRead = (id: string) => {
    setInboxList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, unread: false } : m))
    );
  };

  return (
    <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
      {/* Top Banner & Quick Launch Controls */}
      <div className="bg-black/60 border border-hud-cyan/40 rounded-xl p-3.5 shadow-glow-cyan space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-hud-blue/20 text-hud-cyan border border-hud-cyan/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-hud font-bold text-hud-text tracking-wider uppercase flex items-center gap-1.5">
                <span>MICROSOFT OUTLOOK CONTROLLER</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-hud-green/20 text-hud-green border border-hud-green/30">
                  LINKED
                </span>
              </div>
              <div className="text-[11px] font-mono text-hud-muted">
                {data.message || 'Outlook control subsystem active'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLaunchOutlookWeb}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-hud-cyan/20 hover:bg-hud-cyan text-hud-cyan hover:text-black font-mono text-xs border border-hud-cyan/40 transition-all shadow-glow-cyan"
              title="Open Outlook Web Mail in new tab"
            >
              <span>Outlook Web</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <button
              onClick={handleLaunchOutlookApp}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-white/10 text-hud-text font-mono text-xs border border-hud-cyan/20 transition-all"
              title="Open native Microsoft Outlook app"
            >
              <span>Desktop App</span>
            </button>
          </div>
        </div>

        {/* Compose Trigger */}
        <div className="flex items-center justify-between pt-2 border-t border-hud-cyan/15 text-xs font-mono">
          <button
            onClick={() => setIsComposing(!isComposing)}
            className="flex items-center gap-1.5 text-hud-cyan hover:text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isComposing ? 'Cancel Compose' : 'Compose New Directive / Email'}</span>
          </button>
          <span className="text-hud-muted">
            {inboxList.filter((m) => m.unread).length} Unread Communications
          </span>
        </div>
      </div>

      {/* Compose Form */}
      {isComposing && (
        <form
          onSubmit={handleSendDraft}
          className="p-3.5 rounded-xl bg-hud-bg/80 border border-hud-cyan/40 shadow-glow-cyan space-y-2.5 font-mono text-xs"
        >
          <div className="flex items-center justify-between text-hud-cyan font-bold pb-1 border-b border-hud-cyan/20">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              NEW TRANSMISSION DRAFT
            </span>
          </div>

          {sentSuccess ? (
            <div className="p-3 rounded bg-hud-green/20 border border-hud-green/40 text-hud-green flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Draft dispatched to mail client successfully!</span>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] text-hud-muted uppercase">Recipient (To):</label>
                <input
                  type="email"
                  required
                  placeholder="contact@company.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full mt-0.5 bg-black/50 border border-hud-cyan/30 rounded px-2.5 py-1.5 text-hud-text outline-none focus:border-hud-cyan"
                />
              </div>

              <div>
                <label className="text-[10px] text-hud-muted uppercase">Subject Directive:</label>
                <input
                  type="text"
                  placeholder="Operational update..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full mt-0.5 bg-black/50 border border-hud-cyan/30 rounded px-2.5 py-1.5 text-hud-text outline-none focus:border-hud-cyan"
                />
              </div>

              <div>
                <label className="text-[10px] text-hud-muted uppercase">Message Payload:</label>
                <textarea
                  rows={3}
                  placeholder="Write message..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full mt-0.5 bg-black/50 border border-hud-cyan/30 rounded px-2.5 py-1.5 text-hud-text outline-none focus:border-hud-cyan resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-hud-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded bg-hud-cyan hover:bg-hud-cyan/80 text-black font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Send via Outlook</span>
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Inbox List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-hud-muted border-b border-hud-cyan/20 pb-1.5">
          <span className="flex items-center gap-1.5 text-hud-cyan">
            <Inbox className="w-3.5 h-3.5" />
            OUTLOOK INBOX STREAM
          </span>
          <span>{inboxList.length} Messages</span>
        </div>

        <div className="space-y-2">
          {inboxList.map((msg) => (
            <div
              key={msg.id}
              onClick={() => {
                setSelectedMsg(msg);
                handleMarkAsRead(msg.id);
              }}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                msg.unread
                  ? 'bg-hud-cyan/10 border-hud-cyan/50 hover:border-hud-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                  : 'bg-hud-bg/50 border-hud-cyan/20 hover:border-hud-cyan/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 truncate">
                  {msg.unread && (
                    <span className="w-2 h-2 rounded-full bg-hud-cyan animate-pulse shrink-0" />
                  )}
                  <span className="font-hud font-bold text-xs text-hud-text truncate">
                    {msg.sender}
                  </span>
                  {msg.priority === 'high' && (
                    <span className="flex items-center gap-0.5 text-[9px] font-mono px-1 rounded bg-hud-red/20 text-hud-red border border-hud-red/30 uppercase">
                      <ShieldAlert className="w-2.5 h-2.5" /> High
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-hud-muted shrink-0">
                  {msg.date}
                </span>
              </div>

              <div className="text-xs font-semibold text-hud-cyan/90 truncate mb-1">
                {msg.subject}
              </div>

              <p className="text-[11px] text-hud-text/75 font-sans line-clamp-2 leading-relaxed">
                {msg.snippet}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Message Inspection Modal */}
      {selectedMsg && (
        <div className="p-3.5 rounded-xl bg-black/80 border border-hud-cyan/50 shadow-glow-cyan space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-hud-cyan/20">
            <span className="text-hud-cyan font-bold">{selectedMsg.subject}</span>
            <button
              onClick={() => setSelectedMsg(null)}
              className="text-hud-muted hover:text-hud-red text-xs px-1.5 py-0.5"
            >
              Close
            </button>
          </div>
          <div className="text-hud-muted text-[11px]">
            From: <span className="text-hud-text">{selectedMsg.sender}</span> ({selectedMsg.senderEmail})
          </div>
          <div className="text-hud-text/90 font-sans text-xs pt-1 leading-relaxed whitespace-pre-wrap">
            {selectedMsg.snippet}
          </div>
          <div className="flex justify-end pt-2">
            <a
              href={`mailto:${selectedMsg.senderEmail}?subject=Re: ${encodeURIComponent(selectedMsg.subject)}`}
              className="px-3 py-1 rounded bg-hud-cyan/20 hover:bg-hud-cyan text-hud-cyan hover:text-black font-bold flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              Reply in Outlook
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

