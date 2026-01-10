/**
 * Upgrade Success Page
 *
 * Shown after successful Stripe payment.
 * Verifies the checkout session and upgrades the user.
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Crown, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../infrastructure/i18n';
import { stripeApi } from '../../../infrastructure/services/api';
import { error as logError } from '../../../infrastructure/logging';

export default function UpgradeSuccessPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        const result = await stripeApi.verifyCheckout(sessionId);
        if (result.success && result.subscription_tier === 'premium') {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        logError('Failed to verify payment', error, { sessionId }, 'UpgradeSuccessPage');
        setStatus('error');
      }
    }

    verifyPayment();
  }, [sessionId]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <div className="flex justify-center mb-6">
            <Loader2 className="w-16 h-16 animate-spin text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t('subscription.verifying')}</h1>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            {t('subscription.verifyFailed')}
          </h1>
          <p className="text-gray-600 mb-8">{t('subscription.verifyFailedDesc')}</p>
          <Link
            to="/"
            className="inline-block w-full py-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg"
          >
            {t('subscription.backToApp')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center relative">
            <Check className="w-12 h-12 text-green-500" />
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          {t('subscription.paymentSuccess')}
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8 text-lg">{t('subscription.paymentSuccessDesc')}</p>

        {/* Back to app button */}
        <Link
          to="/"
          className="inline-block w-full py-4 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg"
        >
          {t('subscription.backToApp')}
        </Link>
      </div>
    </div>
  );
}
