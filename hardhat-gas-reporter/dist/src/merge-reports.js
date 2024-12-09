"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeReports = void 0;
/**
 * Try to merge several gas reporter output objects into one. It will also
 * validate that the config are the same to make sure that the reports were
 * generated by the same source.
 */
function mergeReports(reports) {
    const result = {
        namespace: null,
        config: null,
        info: {
            methods: {},
            deployments: [],
            blockLimit: null,
        },
    };
    for (const report of reports) {
        if (!result.config)
            result.config = report.config;
        if (!result.namespace) {
            result.namespace = report.namespace;
        }
        if (result.namespace !== report.namespace) {
            throw new Error('Cannot merge reports with different namespaces');
        }
        // Update config.gasPrice only if the newer one has a bigger number
        if (typeof report.config.gasPrice === 'number') {
            if (typeof result.config.gasPrice !== 'number' ||
                result.config.gasPrice < report.config.gasPrice) {
                result.config.gasPrice = report.config.gasPrice;
            }
        }
        else {
            result.config.gasPrice = report.config.gasPrice;
        }
        if (!report.info || typeof report.info.blockLimit !== 'number') {
            throw new Error(`Invalid "info" property for given report`);
        }
        if (!result.info.blockLimit) {
            result.info.blockLimit = report.info.blockLimit;
        }
        else if (result.info.blockLimit !== report.info.blockLimit) {
            throw new Error('"info.blockLimit" should be the same on all reports');
        }
        if (!report.info.methods) {
            throw new Error(`Missing "info.methods" property on given report`);
        }
        // Merge info.methods objects
        Object.entries(report.info.methods).forEach(([key, value]) => {
            if (!result.info.methods[key]) {
                result.info.methods[key] = value;
                return;
            }
            result.info.methods[key].gasData = [
                ...result.info.methods[key].gasData,
                ...report.info.methods[key].gasData,
            ].sort((a, b) => a - b);
            result.info.methods[key].numberOfCalls += report.info.methods[key].numberOfCalls;
        });
        if (!Array.isArray(report.info.deployments)) {
            throw new Error(`Invalid "info.deployments" property on given report`);
        }
        // Merge info.deployments objects
        report.info.deployments.forEach(deployment => {
            const current = result.info.deployments.find(d => d.name === deployment.name);
            if (current) {
                current.gasData = [...current.gasData, ...deployment.gasData].sort((a, b) => a - b);
            }
            else {
                result.info.deployments.push(deployment);
            }
        });
    }
    return result;
}
exports.mergeReports = mergeReports;
//# sourceMappingURL=merge-reports.js.map