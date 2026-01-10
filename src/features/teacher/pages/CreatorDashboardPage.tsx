/**
 * Creator Dashboard Page
 *
 * Main hub for teachers to manage their custom adventures.
 */

import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Play, PencilRuler, ArrowLeft } from 'lucide-react';
import { useTeacherContent, useUserProgress } from '../../../infrastructure/storage';
import { useLanguage } from '../../../infrastructure/i18n';

export default function CreatorDashboardPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userData } = useUserProgress();
  // Filter to show only MY adventures for editing
  const { adventures, loading, deleteAdventure } = useTeacherContent({
    filterByUserId: userData.userId,
  });

  const handleDelete = async (adventureId: string, _name: string) => {
    if (confirm(t('creator.deleteConfirm'))) {
      await deleteAdventure(adventureId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Back link */}
          <Link
            to="/t"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <PencilRuler className="w-7 h-7 text-amber-500" />
                {t('creator.title')}
              </h1>
              <p className="text-gray-600 mt-1">{t('creator.subtitle')}</p>
            </div>
            <button
              onClick={() => navigate('/t/creator/adventure')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#4a7a2a] text-white rounded-xl font-medium hover:bg-[#3a6a1a] transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('creator.newAdventure')}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {adventures.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">{t('creator.noAdventures')}</h2>
            <p className="text-gray-600">{t('creator.noAdventuresDesc')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adventures.map((adventure) => (
              <div
                key={adventure.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{adventure.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-800">{adventure.name}</h3>
                        <p className="text-sm text-gray-600">
                          {adventure.levels.length} {t('creator.levels')}
                        </p>
                      </div>
                    </div>
                  </div>
                  {adventure.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {adventure.description}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-3 bg-gray-50 flex gap-2">
                  <button
                    onClick={() => navigate(`/t/creator/adventure/${adventure.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    {t('creator.edit')}
                  </button>
                  <button
                    onClick={() =>
                      navigate(`/t/adventure/${adventure.id}/levels?custom=${adventure.id}`)
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-white bg-[#4a7a2a] rounded-lg hover:bg-[#3a6a1a] transition-colors"
                    disabled={adventure.levels.length === 0}
                  >
                    <Play className="w-4 h-4" />
                    {t('creator.play')}
                  </button>
                  <button
                    onClick={() => handleDelete(adventure.id, adventure.name)}
                    className="flex items-center justify-center px-3 py-2 text-red-600 bg-white rounded-lg border border-gray-200 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
