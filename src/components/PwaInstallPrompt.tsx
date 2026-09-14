'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Check } from 'lucide-react';

interface PwaInstallPromptProps {
  deferredPrompt: any;
  onInstall: () => void;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  deferredPrompt,
  onInstall,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);
  }, []);

  if (dismissed || isStandalone || (!deferredPrompt && !isIos)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-bounce-short">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
          <Smartphone className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-white">Installer l'application</h4>
          <p className="text-xs text-slate-300 mt-0.5">
            {isIos
              ? 'Appuyez sur "Partager" puis "Sur l\'écran d\'accueil" pour l\'utiliser comme une application.'
              : 'Installez l\'application sur votre écran d\'accueil pour un accès ultra-rapide.'}
          </p>

          <div className="mt-3 flex items-center gap-2">
            {deferredPrompt && (
              <button
                onClick={onInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installer maintenant</span>
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-semibold"
            >
              Plus tard
            </button>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
