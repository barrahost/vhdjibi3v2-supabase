import { CulteReportType } from '../../types/culteReport.types';
import { CulteReportFormValues } from '../../utils/culteReportFormHelpers';

interface CulteReportFieldsProps {
  reportType: CulteReportType;
  values: CulteReportFormValues;
  onChange: <K extends keyof CulteReportFormValues>(key: K, value: CulteReportFormValues[K]) => void;
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export function CulteReportFields({ reportType, values: v, onChange }: CulteReportFieldsProps) {
  const set = <K extends keyof CulteReportFormValues>(key: K) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChange(key, e.target.value as CulteReportFormValues[K]);

  if (reportType === 'worship') {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Thème du message</label>
            <input type="text" value={v.messageTheme} onChange={set('messageTheme')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Source / référence du message</label>
            <input type="text" value={v.messageSource} onChange={set('messageSource')} className={inputCls} />
          </div>
        </div>
        <fieldset className="border rounded-md p-4 space-y-3">
          <legend className="text-sm font-semibold text-gray-700 px-1">Présence</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><label className={labelCls}>Hommes</label><input type="number" min="0" value={v.adultMen} onChange={set('adultMen')} className={inputCls} /></div>
            <div><label className={labelCls}>Femmes</label><input type="number" min="0" value={v.adultWomen} onChange={set('adultWomen')} className={inputCls} /></div>
            <div><label className={labelCls}>Garçons</label><input type="number" min="0" value={v.childBoys} onChange={set('childBoys')} className={inputCls} /></div>
            <div><label className={labelCls}>Filles</label><input type="number" min="0" value={v.childGirls} onChange={set('childGirls')} className={inputCls} /></div>
            <div><label className={labelCls}>Serviteurs H.</label><input type="number" min="0" value={v.servedMen} onChange={set('servedMen')} className={inputCls} /></div>
            <div><label className={labelCls}>Serviteurs F.</label><input type="number" min="0" value={v.servedWomen} onChange={set('servedWomen')} className={inputCls} /></div>
            <div><label className={labelCls}>Bloom</label><input type="number" min="0" value={v.blooms} onChange={set('blooms')} className={inputCls} /></div>
          </div>
        </fieldset>
        <fieldset className="border rounded-md p-4 space-y-3">
          <legend className="text-sm font-semibold text-gray-700 px-1">Conversions</legend>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Hommes</label><input type="number" min="0" value={v.conversionMen} onChange={set('conversionMen')} className={inputCls} /></div>
            <div><label className={labelCls}>Femmes</label><input type="number" min="0" value={v.conversionWomen} onChange={set('conversionWomen')} className={inputCls} /></div>
          </div>
        </fieldset>
        <fieldset className="border rounded-md p-4 space-y-3">
          <legend className="text-sm font-semibold text-gray-700 px-1">Nouveaux membres</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><label className={labelCls}>Hommes</label><input type="number" min="0" value={v.newMemberMen} onChange={set('newMemberMen')} className={inputCls} /></div>
            <div><label className={labelCls}>Femmes</label><input type="number" min="0" value={v.newMemberWomen} onChange={set('newMemberWomen')} className={inputCls} /></div>
            <div><label className={labelCls}>Bloom</label><input type="number" min="0" value={v.newMemberBlooms} onChange={set('newMemberBlooms')} className={inputCls} /></div>
            <div><label className={labelCls}>Enfants</label><input type="number" min="0" value={v.newMemberChildren} onChange={set('newMemberChildren')} className={inputCls} /></div>
          </div>
        </fieldset>
      </>
    );
  }

  if (reportType === 'adn') {
    return (
      <>
        <fieldset className="border rounded-md p-4 space-y-3">
          <legend className="text-sm font-semibold text-gray-700 px-1">Nouveaux visiteurs</legend>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Hommes</label><input type="number" min="0" value={v.newVisitorMen} onChange={set('newVisitorMen')} className={inputCls} /></div>
            <div><label className={labelCls}>Femmes</label><input type="number" min="0" value={v.newVisitorWomen} onChange={set('newVisitorWomen')} className={inputCls} /></div>
          </div>
        </fieldset>
        <fieldset className="border rounded-md p-4 space-y-3">
          <legend className="text-sm font-semibold text-gray-700 px-1">Décisions</legend>
          <div><label className={labelCls}>Indécis</label><input type="number" min="0" value={v.undecided} onChange={set('undecided')} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Veut rejoindre — Hommes</label><input type="number" min="0" value={v.wantsToJoinMen} onChange={set('wantsToJoinMen')} className={inputCls} /></div>
            <div><label className={labelCls}>Veut rejoindre — Femmes</label><input type="number" min="0" value={v.wantsToJoinWomen} onChange={set('wantsToJoinWomen')} className={inputCls} /></div>
            <div><label className={labelCls}>Donne sa vie — Hommes</label><input type="number" min="0" value={v.wantsLifeMen} onChange={set('wantsLifeMen')} className={inputCls} /></div>
            <div><label className={labelCls}>Donne sa vie — Femmes</label><input type="number" min="0" value={v.wantsLifeWomen} onChange={set('wantsLifeWomen')} className={inputCls} /></div>
          </div>
        </fieldset>
      </>
    );
  }

  if (reportType === 'finance') {
    return (
      <fieldset className="border rounded-md p-4 space-y-3">
        <legend className="text-sm font-semibold text-gray-700 px-1">Offrandes</legend>
        <div><label className={labelCls}>Dîmes</label><input type="number" min="0" value={v.tithes} onChange={set('tithes')} className={inputCls} /></div>
        <div><label className={labelCls}>Offrandes régulières</label><input type="number" min="0" value={v.regularOfferings} onChange={set('regularOfferings')} className={inputCls} /></div>
        <div><label className={labelCls}>Offrandes spéciales</label><input type="number" min="0" value={v.specialOfferings} onChange={set('specialOfferings')} className={inputCls} /></div>
      </fieldset>
    );
  }

  if (reportType === 'sainte_cene') {
    return (
      <fieldset className="border rounded-md p-4 space-y-3">
        <legend className="text-sm font-semibold text-gray-700 px-1">Sainte Cène</legend>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Pains préparés</label><input type="number" min="0" value={v.painsPreparees} onChange={set('painsPreparees')} className={inputCls} /></div>
          <div><label className={labelCls}>Vins préparés</label><input type="number" min="0" value={v.vinsPreparees} onChange={set('vinsPreparees')} className={inputCls} /></div>
          <div><label className={labelCls}>Pains distribués</label><input type="number" min="0" value={v.painsDistribuees} onChange={set('painsDistribuees')} className={inputCls} /></div>
          <div><label className={labelCls}>Vins distribués</label><input type="number" min="0" value={v.vinsDistribuees} onChange={set('vinsDistribuees')} className={inputCls} /></div>
        </div>
      </fieldset>
    );
  }

  if (reportType === 'sono') {
    return (
      <>
        <fieldset className="border rounded-md p-4 space-y-3">
          <legend className="text-sm font-semibold text-gray-700 px-1">Avant le culte</legend>
          {(Object.keys(v.sonoBefore) as (keyof typeof v.sonoBefore)[]).map((key) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-gray-700">{key}</label>
              <select
                value={v.sonoBefore[key]}
                onChange={(e) => onChange('sonoBefore', { ...v.sonoBefore, [key]: e.target.value })}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="OK">OK</option>
                <option value="NOK">NOK</option>
              </select>
            </div>
          ))}
        </fieldset>
        <fieldset className="border rounded-md p-4 space-y-3">
          <legend className="text-sm font-semibold text-gray-700 px-1">Pendant le culte</legend>
          <div>
            <label className={labelCls}>Problèmes techniques</label>
            <textarea
              rows={2}
              value={v.sonoDuring.technicalProblems}
              onChange={(e) => onChange('sonoDuring', { ...v.sonoDuring, technicalProblems: e.target.value })}
              className={inputCls}
            />
          </div>
        </fieldset>
        <fieldset className="border rounded-md p-4 space-y-3">
          <legend className="text-sm font-semibold text-gray-700 px-1">Après le culte</legend>
          <div>
            <label className={labelCls}>Heure de publication audio</label>
            <input
              type="text"
              value={v.sonoAfter.audioReplayTime}
              onChange={(e) => onChange('sonoAfter', { ...v.sonoAfter, audioReplayTime: e.target.value })}
              className={inputCls}
            />
          </div>
        </fieldset>
        <div>
          <label className={labelCls}>Observations générales</label>
          <textarea rows={3} value={v.generalObservations} onChange={set('generalObservations')} className={inputCls} />
        </div>
      </>
    );
  }

  if (reportType === 'academie') {
    return (
      <fieldset className="border rounded-md p-4 space-y-3">
        <legend className="text-sm font-semibold text-gray-700 px-1">Classe</legend>
        <div><label className={labelCls}>Nom de la classe</label><input type="text" value={v.className} onChange={set('className')} className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Étudiants inscrits</label><input type="number" min="0" value={v.actualStudents} onChange={set('actualStudents')} className={inputCls} /></div>
          <div><label className={labelCls}>Étudiants présents</label><input type="number" min="0" value={v.presentStudents} onChange={set('presentStudents')} className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>Modérateur</label><input type="text" value={v.moderator} onChange={set('moderator')} className={inputCls} /></div>
        <div><label className={labelCls}>Cours du jour</label><input type="text" value={v.courseOfTheDay} onChange={set('courseOfTheDay')} className={inputCls} /></div>
        <div><label className={labelCls}>Ambiance spirituelle</label><input type="text" value={v.spiritualAtmosphere} onChange={set('spiritualAtmosphere')} className={inputCls} /></div>
        <div><label className={labelCls}>Participation de la classe</label><input type="text" value={v.classParticipation} onChange={set('classParticipation')} className={inputCls} /></div>
        <div><label className={labelCls}>Prochain cours</label><input type="text" value={v.nextCourse} onChange={set('nextCourse')} className={inputCls} /></div>
        <div><label className={labelCls}>Prochain modérateur</label><input type="text" value={v.nextModerator} onChange={set('nextModerator')} className={inputCls} /></div>
      </fieldset>
    );
  }

  return null;
}
