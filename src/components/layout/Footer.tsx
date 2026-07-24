import { Link } from "react-router-dom";
import { AtSign, Share2, PlaySquare, MessageCircle } from "lucide-react";
import { useCMSStore } from "../../store/cmsStore";

export default function Footer() {
  const settings = useCMSStore((s) => s.settings);
  const footerGroups = useCMSStore((s) => s.footerGroups);

  return (
    <footer style={{ background: "var(--color-secondary)" }} className="text-neutral-300 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <span className="font-display text-2xl text-white">{settings.brandName}</span>
          <p className="text-sm mt-3 max-w-xs text-neutral-400 leading-relaxed">{settings.footerAboutText}</p>
          <div className="flex items-center gap-3 mt-4">
            <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-white/20">
              <AtSign size={16} />
            </a>
            <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-white/20">
              <Share2 size={16} />
            </a>
            <a href={settings.youtubeUrl} target="_blank" rel="noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-white/20">
              <PlaySquare size={16} />
            </a>
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-white/10 rounded-full hover:bg-white/20"
            >
              <MessageCircle size={16} />
            </a>
          </div>
        </div>
        {footerGroups.map((g) => (
          <div key={g.groupName}>
            <h4 className="font-label text-sm text-white mb-3 tracking-wider">{g.groupName}</h4>
            <ul className="space-y-2 text-sm">
              {g.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.url} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <span>{settings.footerCopyrightText}</span>
          <span>{settings.businessAddress}</span>
        </div>
      </div>
    </footer>
  );
}
