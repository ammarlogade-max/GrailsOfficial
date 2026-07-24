import { useCMSStore } from "../../store/cmsStore";

export default function AnnouncementBar() {
  const announcement = useCMSStore((s) => s.announcement);
  if (!announcement.active) return null;
  return (
    <div
      className="overflow-hidden py-2 text-xs sm:text-sm"
      style={{ background: announcement.bgColor, color: announcement.textColor }}
    >
      <div className="marquee-track" style={{ animationDuration: `${announcement.scrollSpeed}s` }}>
        <span className="font-label px-6">{announcement.text}</span>
        <span className="font-label px-6">{announcement.text}</span>
        <span className="font-label px-6">{announcement.text}</span>
        <span className="font-label px-6">{announcement.text}</span>
      </div>
    </div>
  );
}
