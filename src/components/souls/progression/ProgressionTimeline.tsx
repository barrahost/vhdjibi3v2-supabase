import { SpiritualProfile } from '../../../types/database.types';
import { formatDate } from '../../../utils/dateUtils';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';

interface ProgressionTimelineProps {
  spiritualProfile: SpiritualProfile;
  compact?: boolean;
}

export function ProgressionTimeline({ spiritualProfile, compact = false }: ProgressionTimelineProps) {
  const steps = [
    {
      title: 'Donner sa vie à Jésus',
      completed: spiritualProfile.isBornAgain,
      date: spiritualProfile.bornAgainDate,
      description: 'Nouvelle naissance',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Baptême',
      completed: spiritualProfile.isBaptized,
      date: spiritualProfile.baptismDate,
      description: 'Baptême d\'eau',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Académie VDH',
      completed: spiritualProfile.isEnrolledInAcademy,
      date: spiritualProfile.academyEnrollmentDate,
      description: 'Formation de base',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'École PDV',
      completed: spiritualProfile.isEnrolledInLifeBearers,
      date: spiritualProfile.lifeBearersEnrollmentDate,
      description: 'Formation avancée',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Service',
      completed: spiritualProfile.departments?.length > 0,
      date: spiritualProfile.departments?.[0]?.startDate,
      description: spiritualProfile.departments?.length > 0 
        ? spiritualProfile.departments.map(d => d.name).join(', ')
        : 'Aucun département',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      extraInfo: spiritualProfile.departments?.length > 0 && (
        <div className="mt-2 space-y-1">
          {spiritualProfile.departments.map(dept => (
            <div key={dept.name} className="text-xs text-gray-500">
              {dept.name} - depuis le {formatDate(dept.startDate)}
            </div>
          ))}
        </div>
      )
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#00665C] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-gray-500">
          {completedSteps}/{steps.length}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#00665C] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-gray-500">
          {completedSteps}/{steps.length} étapes complétées
        </span>
      </div>

      <div className="flow-root">
        <ul className="-mb-8">
          {steps.map((step, idx) => (
            <li key={step.title}>
              <div className="relative pb-8">
                {idx !== steps.length - 1 && (
                  <span
                    className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                      step.completed ? 'bg-[#00665C]' : 'bg-gray-200'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      step.completed ? step.bgColor : 'bg-gray-100'
                    }`}>
                      {step.completed ? (
                        <CheckCircle2 className={`w-5 h-5 ${step.color}`} />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className={`text-sm font-medium ${
                        step.completed ? step.color : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {step.description}
                      </p>
                      {step.extraInfo}
                    </div>
                    {step.date && (
                      <div className="whitespace-nowrap text-right text-sm text-gray-500">
                        {formatDate(step.date)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}