import { DataSource as GeotoolkitDataSource } from '@int/geotoolkit/data/DataSource';
import { obfuscate } from '@int/geotoolkit/lib';
import { HttpClient } from '@int/geotoolkit/http/HttpClient';
import { RemoteWelllogDataSource } from '@int/geotoolkit/intgeo/RemoteWelllogDataSource';
import { LogCurveDataSource } from '@int/geotoolkit/welllog/data/LogCurveDataSource';
import { DataTable } from '@int/geotoolkit/data/DataTable';
import { CurveBinding } from './curvebinding';
import { DataBinding } from '@int/geotoolkit/data/DataBinding';
import { Range } from '@int/geotoolkit/util/Range';
import { INumericalDataSeries } from '@int/geotoolkit/data/INumericalDataSeries';
import { DataSeries } from '@int/geotoolkit/data/DataSeries';

const _config = {
    intgeourl: 'https://demo.int.com/INTGeoServer/',
    wellfiles: [
        'data/las/34_10-A-10.las',
        'data/las/34_10-A-11.las',
        'data/las/34_10-A-14.las'
    ]
};
const http = HttpClient.getInstance().getHttp();

export class LogDataSource extends GeotoolkitDataSource {
    private dataTable: DataTable;
    private curves: any;
    private curveBinding = new CurveBinding();
    constructor(dataTable: DataTable) {
        super();
        this.dataTable = dataTable;
        this.curves = {};
    }
    private static  async getCurvesData(remoteWelllog, curveNames) {
        const cols = [];
        const data = [];
        const promises = [];
        curveNames.forEach((curveName, curveIdx) => {
            promises.push(
                new Promise(((resolve, reject) => {
                    remoteWelllog.readCurve(curveName,
                        (curveData) => {
                            cols[curveIdx] = {
                                'name': curveData['shortName'],
                                'type': 'number',
                                'unit': curveData['unitSymbol']
                            };
                            data[curveIdx] = curveData['values'];
                            resolve(null);
                        },
                        () => {
                            reject('An error happened ');
                        });
                }))
            );
        });
        return Promise.all(promises).then(() => {
            return {
                cols: cols,
                data: data
            };
        });
    }
    private static  async getWellDepths(file) {
        const wellDepthsUrl = _config.intgeourl + 'json/welldepths?json=' + encodeURIComponent(JSON.stringify({
            'filePath': file
        }));
        return http.get(wellDepthsUrl, {
            'responseType': 'json',
            'transformResponse': function (response) {
                return response['data'];
            }
        });
    }
    private static  getDataTableData(remoteWelllog, file, wellIdx) {
        const curveNames = [
            ['GR', 'RHOB', 'NPHI', 'ILD', 'ILM'],
            ['GR', 'RHOB', 'NPHI', 'ILD', 'ILM'],
            ['GR', 'RHOB', 'NPHI', 'ILD', 'ILM']
        ];
        const tableData = {
            'cols': [{
                // indices column
                'name': 'depth',
                'type': 'number',
                'unit': 'ft'
            }],
            'colsdata': [],
            'meta': {
                'index': 'depth'
            }
        };
        return LogDataSource.getWellDepths(file).then((wellDepthData) => {
            const indices = wellDepthData['curveMds'];
            // The first element in colsdata contains the indices
            tableData['colsdata'].push(indices);
            return LogDataSource.getCurvesData(remoteWelllog, curveNames[wellIdx]).then((data) => {
                const curvesCols = data['cols'];
                const curvesData = data['data'];
                tableData['cols'] = tableData['cols'].concat(curvesCols);
                tableData['colsdata'] = tableData['colsdata'].concat(curvesData);
                return tableData;
            });
        });
    }
    static async getGeoServerData() {
        const dtViews = [];
        return new Promise(((resolve, reject) => {
            const wellFiles = _config.wellfiles;
            const promises = [];
            wellFiles.forEach((file, wellIdx) => {
                const remoteWelllog = new RemoteWelllogDataSource({
                    'server': _config.intgeourl,
                    'metaservice': 'json/welltrajectory',
                    'dataservice': 'json/logcurvedata',
                    'file': file
                });
                // Get Data from INT GeoServer
                promises.push(LogDataSource.getDataTableData(remoteWelllog, file, wellIdx)
                    .then((tableData) => {
                        const dt = new DataTable(tableData);
                        dtViews[wellIdx] = dt;
                        return dt;
                    })
                    .catch((error) => {
                        reject(error);
                    })
                );
            });
            Promise.all(promises).then(() => {
                resolve(dtViews);
            });
        }));
    }
    getDepthLimits(): Range {
        const indexName = this.dataTable.getMetaData()['index'];
        const depths = this.dataTable.getColumnByName(indexName) as unknown as INumericalDataSeries;
        return new Range(depths.getMin(), depths.getMax());
    }
    getCurveSource(id): LogCurveDataSource {
        const dataTable = this.dataTable;
        if (dataTable == null) {
            return null;
        }
        if (this.curves[id]) {
            return this.curves[id];
        }
        const indexName = dataTable.getMetaData()['index'];
        const depths = dataTable.getColumnByName(indexName) as DataSeries;
        const values = dataTable.getColumnByName(id) as DataSeries;
        // Sets data source
        const curve = values != null ? (new LogCurveDataSource({
            'depths': depths,
            'values': values
        })) : null;
        this.curves[id] = curve;
        return curve;
    }
    getDataBinding(): DataBinding {
        return this.curveBinding;
    }
}
obfuscate(LogDataSource);
