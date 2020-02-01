// Seismic
import { SeismicImage } from '@int/geotoolkit/seismic/image/SeismicImage';
import { SeismicPipeline } from '@int/geotoolkit/seismic/pipeline/SeismicPipeline';
import { NormalizationType } from '@int/geotoolkit/seismic/pipeline/NormalizationType';
import { SeismicColors } from '@int/geotoolkit/seismic/util/SeismicColors';
import { RemoteSeismicDataSource } from '@int/geotoolkit/seismic/data/RemoteSeismicDataSource';
// Attributes
import { LineStyle } from '@int/geotoolkit/attributes/LineStyle';
// Utils
import { Rect } from '@int/geotoolkit/util/Rect';
import { CacheMode } from '@int/geotoolkit/scene/Cache';


export class SeismicView {
    private start: number;
    private end: number;
    private image: SeismicImage;
    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
        // Seismic image is cerated with independent cache
        this.image = new SeismicImage(null, new Rect(0, 0, 1, 1), null, null, null, CacheMode.Independent)
            .setLineStyle(new LineStyle('rgba(0,0,0,1)')
                .setPixelSnapMode({ 'x': true, 'y': true })
            );
        this.createReader(this.start, this.end, (reader) => {
            const pipeline = this.createPipeline(reader);
            this.image.setPipeline(pipeline);
            const toTrace = reader.getNumberOfTraces();
            const sampleRate = reader.getSampleRate();
            const samplesAmount = reader.getNumberOfSamples();
            this.image.setModelLimits(new Rect(0, 0, toTrace, samplesAmount * sampleRate));
            this.image.invalidate();
        });
    }
    getImage(): SeismicImage {
        return this.image;
    }
    private createSectionQuery(position, key, oppositeKey) {
        const selectKeys = [];
        selectKeys[0] = {
            'name': key['key'],
            'min': position,
            'max': position,
            'step': key['increment'],
            'order': 'asc'
        };

        selectKeys[1] = {
            'name': oppositeKey['key'],
            'min': oppositeKey['min'],
            'max': oppositeKey['max'],
            'step': oppositeKey['increment'],
            'order': 'asc'
        };
        return {
            'keys': selectKeys,
            'options': null,
            'emptyTracesKey': {
                'name': oppositeKey['key'],
                'min': oppositeKey['min'],
                'max': oppositeKey['max']
            }
        };
    }
    private createReader(start, end, onready) {
        const host = 'https://demo.int.com/INTGeoServer/json';
        const data = new RemoteSeismicDataSource({
            'host': host,
            'file': 'data/seismic/Gullfaks_Amplitude.xgy',
            'version': 2
        });
        // request data source
        data.open(() => {
            const keys = data.getKeys();
            const key = keys[0]; // INLINE
            const oppositeKey = keys[1]; // XLINE
            oppositeKey['min'] = start;
            oppositeKey['max'] = end;
            // request the fist INLINE
            const query = this.createSectionQuery(key['min'], key, oppositeKey);
            data.select(query, (reader) => {
                onready(reader);
            });
        }, () => {}
        );
    }
    private createPipeline(reader) {
        const pipeline = new SeismicPipeline('Seismic', reader, reader.getStatistics());
        pipeline.setOptions({
            'normalization': {
                'type': NormalizationType.RMS,
                'scale': 0.4
            },
            'plot': {
                'type': {
                    'Wiggle': false,
                    'InterpolatedDensity': true
                },
                'decimationSpacing': 5
            },
            'colors': {
                'colorMap': SeismicColors.getDefault().createNamedColorMap('WhiteBlack', 256)
            }
        });
        return pipeline;
    }
}
