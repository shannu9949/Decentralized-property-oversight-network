import { EthGasReporterOutput } from './types';
/**
 * Try to merge several gas reporter output objects into one. It will also
 * validate that the config are the same to make sure that the reports were
 * generated by the same source.
 */
export declare function mergeReports(reports: EthGasReporterOutput[]): EthGasReporterOutput;
//# sourceMappingURL=merge-reports.d.ts.map