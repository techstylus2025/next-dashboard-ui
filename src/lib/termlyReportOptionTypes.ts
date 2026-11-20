export type TermlyReportOptionLists = {
  interest: string[];
  conduct: string[];
  supervisorRemarks: string[];
  headteacherRemarks: string[];
  customEntryAccess: {
    interest: boolean;
    conduct: boolean;
    supervisorRemarks: boolean;
  };
};

export const EMPTY_TERMLY_REPORT_OPTION_LISTS: TermlyReportOptionLists = {
  interest: [],
  conduct: [],
  supervisorRemarks: [],
  headteacherRemarks: [],
  customEntryAccess: {
    interest: true,
    conduct: true,
    supervisorRemarks: true,
  },
};
