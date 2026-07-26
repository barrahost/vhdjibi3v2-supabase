import {
  CulteReportType,
  CulteReportData,
  WorshipReportData,
  AdnReportData,
  FinanceReportData,
  SainteCeneReportData,
  SonoReportData,
  AcademieReportData,
} from '../types/culteReport.types';

export interface CulteReportFormValues {
  messageTheme: string;
  messageSource: string;
  speakerName: string;
  adultMen: string; adultWomen: string; childBoys: string; childGirls: string;
  servedMen: string; servedWomen: string; blooms: string;
  conversionMen: string; conversionWomen: string;
  newMemberMen: string; newMemberWomen: string; newMemberBlooms: string; newMemberChildren: string;

  newVisitorMen: string; newVisitorWomen: string; undecided: string;
  wantsToJoinMen: string; wantsToJoinWomen: string; wantsLifeMen: string; wantsLifeWomen: string;

  tithes: string; regularOfferings: string; specialOfferings: string;

  painsPreparees: string; vinsPreparees: string; painsDistribuees: string; vinsDistribuees: string;

  sonoBefore: Record<string, string>;
  sonoDuring: { proclamationLaunch: string; roomSoundQuality: string; liveStreaming: string; onlineSoundQuality: string; onlineVideoQuality: string; photoshootDuringService: string; technicalProblems: string };
  sonoAfter: { servantsPhotos: string; photoMasking: string; audioReplayPublication: string; audioReplayTime: string; videoReplayPublication: string; fileArchiving: string };
  generalObservations: string;

  className: string; actualStudents: string; presentStudents: string; moderator: string;
  courseOfTheDay: string; spiritualAtmosphere: string; classParticipation: string;
  nextCourse: string; nextModerator: string; nextMeditation: string; nextExercise: string;
}

function n(v: string): number {
  const parsed = parseInt(v, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function blankFormValues(): CulteReportFormValues {
  return {
    messageTheme: '', messageSource: '', speakerName: '',
    adultMen: '0', adultWomen: '0', childBoys: '0', childGirls: '0',
    servedMen: '0', servedWomen: '0', blooms: '0',
    conversionMen: '0', conversionWomen: '0',
    newMemberMen: '0', newMemberWomen: '0', newMemberBlooms: '0', newMemberChildren: '0',

    newVisitorMen: '0', newVisitorWomen: '0', undecided: '0',
    wantsToJoinMen: '0', wantsToJoinWomen: '0', wantsLifeMen: '0', wantsLifeWomen: '0',

    tithes: '0', regularOfferings: '0', specialOfferings: '0',

    painsPreparees: '0', vinsPreparees: '0', painsDistribuees: '0', vinsDistribuees: '0',

    sonoBefore: {
      materialCheck: 'OK', soundQualityTest: 'OK', liveStreamingTest: 'OK',
      onlineSoundTest: 'OK', onlineVideoTest: 'OK', photoEquipmentPrep: 'OK',
    },
    sonoDuring: {
      proclamationLaunch: 'OK', roomSoundQuality: 'SATISFAISANT', liveStreaming: 'OUI',
      onlineSoundQuality: 'BONNE', onlineVideoQuality: 'BONNE', photoshootDuringService: 'OUI',
      technicalProblems: '',
    },
    sonoAfter: {
      servantsPhotos: 'OUI', photoMasking: 'EFFECTUEE', audioReplayPublication: 'OK',
      audioReplayTime: '', videoReplayPublication: 'OK', fileArchiving: 'OK',
    },
    generalObservations: '',

    className: '', actualStudents: '0', presentStudents: '0', moderator: '',
    courseOfTheDay: '', spiritualAtmosphere: '', classParticipation: '',
    nextCourse: '', nextModerator: '', nextMeditation: '', nextExercise: '',
  };
}

export function valuesFromExistingData(reportType: CulteReportType, data: CulteReportData): CulteReportFormValues {
  const blank = blankFormValues();
  switch (reportType) {
    case 'worship': {
      const d = data as WorshipReportData;
      return {
        ...blank,
        messageTheme: d.messageTheme || '', messageSource: d.messageSource || '', speakerName: d.speakerName || '',
        adultMen: String(d.attendance?.adults?.men ?? 0), adultWomen: String(d.attendance?.adults?.women ?? 0),
        childBoys: String(d.attendance?.children?.boys ?? 0), childGirls: String(d.attendance?.children?.girls ?? 0),
        servedMen: String(d.attendance?.served?.men ?? 0), servedWomen: String(d.attendance?.served?.women ?? 0),
        blooms: String(d.attendance?.blooms ?? 0),
        conversionMen: String(d.attendance?.conversions?.men ?? 0), conversionWomen: String(d.attendance?.conversions?.women ?? 0),
        newMemberMen: String(d.newMembers?.men ?? 0), newMemberWomen: String(d.newMembers?.women ?? 0),
        newMemberBlooms: String(d.newMembers?.blooms ?? 0), newMemberChildren: String(d.newMembers?.children ?? 0),
      };
    }
    case 'adn': {
      const d = data as AdnReportData;
      return {
        ...blank,
        newVisitorMen: String(d.newVisitors?.men ?? 0), newVisitorWomen: String(d.newVisitors?.women ?? 0),
        undecided: String(d.visitorDecisions?.undecided ?? 0),
        wantsToJoinMen: String(d.visitorDecisions?.wantsToJoin?.men ?? 0), wantsToJoinWomen: String(d.visitorDecisions?.wantsToJoin?.women ?? 0),
        wantsLifeMen: String(d.visitorDecisions?.wantsToGiveLifeToJesus?.men ?? 0), wantsLifeWomen: String(d.visitorDecisions?.wantsToGiveLifeToJesus?.women ?? 0),
      };
    }
    case 'finance': {
      const d = data as FinanceReportData;
      return { ...blank, tithes: String(d.tithes ?? 0), regularOfferings: String(d.regularOfferings ?? 0), specialOfferings: String(d.specialOfferings ?? 0) };
    }
    case 'sainte_cene': {
      const d = data as SainteCeneReportData;
      return {
        ...blank,
        painsPreparees: String(d.painsPreparees ?? 0), vinsPreparees: String(d.vinsPreparees ?? 0),
        painsDistribuees: String(d.painsDistribuees ?? 0), vinsDistribuees: String(d.vinsDistribuees ?? 0),
      };
    }
    case 'sono': {
      const d = data as SonoReportData;
      return {
        ...blank,
        sonoBefore: { ...blank.sonoBefore, ...(d.beforeService || {}) },
        sonoDuring: { ...blank.sonoDuring, ...(d.duringService || {}), technicalProblems: d.duringService?.technicalProblems || '' },
        sonoAfter: { ...blank.sonoAfter, ...(d.afterService || {}), audioReplayTime: d.afterService?.audioReplayTime || '' },
        generalObservations: d.generalObservations || '',
      };
    }
    case 'academie': {
      const d = data as AcademieReportData;
      return {
        ...blank,
        className: d.className || '', actualStudents: String(d.actualStudents ?? 0), presentStudents: String(d.presentStudents ?? 0),
        moderator: d.moderator || '', courseOfTheDay: d.courseOfTheDay || '', spiritualAtmosphere: d.spiritualAtmosphere || '',
        classParticipation: d.classParticipation || '', nextCourse: d.nextCourse || '', nextModerator: d.nextModerator || '',
        nextMeditation: d.nextMeditation || '', nextExercise: d.nextExercise || '',
      };
    }
    default:
      return blank;
  }
}

export function buildCulteReportData(reportType: CulteReportType, v: CulteReportFormValues): CulteReportData | null {
  switch (reportType) {
    case 'worship': {
      const data: WorshipReportData = {
        messageTheme: v.messageTheme, messageSource: v.messageSource, speakerName: v.speakerName || undefined,
        attendance: {
          adults: { men: n(v.adultMen), women: n(v.adultWomen) },
          children: { boys: n(v.childBoys), girls: n(v.childGirls) },
          served: { men: n(v.servedMen), women: n(v.servedWomen) },
          blooms: n(v.blooms),
          conversions: { men: n(v.conversionMen), women: n(v.conversionWomen) },
        },
        newMembers: {
          men: n(v.newMemberMen), women: n(v.newMemberWomen),
          blooms: n(v.newMemberBlooms), children: n(v.newMemberChildren),
        },
        totalParticipants: n(v.adultMen) + n(v.adultWomen) + n(v.childBoys) + n(v.childGirls) + n(v.servedMen) + n(v.servedWomen),
        totalNewMembers: n(v.newMemberMen) + n(v.newMemberWomen) + n(v.newMemberBlooms) + n(v.newMemberChildren),
      };
      return data;
    }
    case 'adn': {
      const data: AdnReportData = {
        newVisitors: { men: n(v.newVisitorMen), women: n(v.newVisitorWomen) },
        visitorDecisions: {
          undecided: n(v.undecided),
          wantsToJoin: { men: n(v.wantsToJoinMen), women: n(v.wantsToJoinWomen) },
          wantsToGiveLifeToJesus: { men: n(v.wantsLifeMen), women: n(v.wantsLifeWomen) },
        },
        totalNewVisitors: n(v.newVisitorMen) + n(v.newVisitorWomen),
        totalWantsToJoin: n(v.wantsToJoinMen) + n(v.wantsToJoinWomen),
        totalWantsToGiveLifeToJesus: n(v.wantsLifeMen) + n(v.wantsLifeWomen),
      };
      return data;
    }
    case 'finance': {
      const data: FinanceReportData = {
        tithes: n(v.tithes), regularOfferings: n(v.regularOfferings), specialOfferings: n(v.specialOfferings),
        totalFinances: n(v.tithes) + n(v.regularOfferings) + n(v.specialOfferings),
      };
      return data;
    }
    case 'sainte_cene': {
      const data: SainteCeneReportData = {
        painsPreparees: n(v.painsPreparees), vinsPreparees: n(v.vinsPreparees),
        painsDistribuees: n(v.painsDistribuees), vinsDistribuees: n(v.vinsDistribuees),
        painsRestantes: n(v.painsPreparees) - n(v.painsDistribuees),
        vinsRestantes: n(v.vinsPreparees) - n(v.vinsDistribuees),
      };
      return data;
    }
    case 'sono': {
      const data: SonoReportData = {
        beforeService: v.sonoBefore as SonoReportData['beforeService'],
        duringService: { ...v.sonoDuring, technicalProblems: v.sonoDuring.technicalProblems || undefined } as SonoReportData['duringService'],
        afterService: { ...v.sonoAfter, audioReplayTime: v.sonoAfter.audioReplayTime || undefined } as SonoReportData['afterService'],
        generalObservations: v.generalObservations || undefined,
      };
      return data;
    }
    case 'academie': {
      const data: AcademieReportData = {
        className: v.className, actualStudents: n(v.actualStudents), presentStudents: n(v.presentStudents),
        moderator: v.moderator, courseOfTheDay: v.courseOfTheDay, spiritualAtmosphere: v.spiritualAtmosphere,
        classParticipation: v.classParticipation, nextCourse: v.nextCourse, nextModerator: v.nextModerator,
        nextMeditation: v.nextMeditation, nextExercise: v.nextExercise,
      };
      return data;
    }
    default:
      return null;
  }
}
