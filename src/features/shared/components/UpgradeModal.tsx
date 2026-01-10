/**
 * UpgradeModal Component
 *
 * Shows when a user tries to access premium content without a subscription.
 * Redirects to Stripe Checkout for payment.
 */

import { useState } from 'react';
import { Crown, X, Star, Sparkles, Zap, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../infrastructure/i18n';
import { stripeApi } from '../../../infrastructure/services/api';
import { error as logError } from '../../../infrastructure/logging';

interface UpgradeModalProps {
  onClose: () => void;
}

export function UpgradeModal({ onClose }: UpgradeModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    { icon: Star, text: t('subscription.feature1') },
    { icon: Sparkles, text: t('subscription.feature2') },
    { icon: Zap, text: t('subscription.feature3') },
  ];

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Create Stripe Checkout session and redirect
      const { checkout_url } = await stripeApi.createCheckoutSession();
      window.location.href = checkout_url;
    } catch (error) {
      logError('Failed to create checkout session', error, undefined, 'UpgradeModal');
      alert('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-[bounceIn_0.3s_ease-out] relative">
        {/* Close button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Crown icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center">
            <Crown className="w-10 h-10 text-amber-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          {t('subscription.upgradeTitle')}
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 text-center mb-6">{t('subscription.upgradeSubtitle')}</p>

        {/* Features list */}
        <div className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 text-gray-700">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Upgrade button */}
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-amber-200 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('subscription.redirecting')}
            </>
          ) : (
            t('subscription.upgradeButton')
          )}
        </button>

        {/* Maybe later */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 text-sm mt-3 hover:text-gray-700 transition-colors"
          >
            {t('subscription.maybeLater')}
          </button>
        )}
      </div>
    </div>
  );
}
