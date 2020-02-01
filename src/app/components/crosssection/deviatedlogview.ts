// Attributes
import { FillStyle } from '@int/geotoolkit/attributes/FillStyle';
// Utils
import { Rect } from '@int/geotoolkit/util/Rect';
// Deviation
import { DeviatedCompositeNode } from '@int/geotoolkit/deviation/scene/DeviatedCompositeNode';
// WellLog
import { TrackFactory } from '@int/geotoolkit/welllog/TrackFactory';
import { TrackType } from '@int/geotoolkit/welllog/TrackType';
import { LogCurve } from '@int/geotoolkit/welllog/LogCurve';
import { TrackContainer } from '@int/geotoolkit/welllog/TrackContainer';

const deviatedTrackWidth = 100;
export class DeviatedLogView {
    private shape: DeviatedCompositeNode;
    constructor(trajectory, dataSource, minDepth, maxDepth) {
        this.shape = new DeviatedCompositeNode()
            .setDeviation({
                'clip': false,
                'trajectory': trajectory,
                'trackWidth': deviatedTrackWidth,
                'offset': deviatedTrackWidth / 2
            });
        const factory = TrackFactory.getInstance();
        const track = factory.createTrack(TrackType.LinearTrack, {
            'width': deviatedTrackWidth,
            'border': {
                'visible': true
            }
        });
        track.setFillStyle(new FillStyle({ 'color': 'rgba( 128, 128, 128, 0.5)' }));
        // Add curves
        const curveCALI = new LogCurve(dataSource.getCurveSource('GR'))
            .setLineStyle({ 'color': 'green', 'width': 2 });
        const curveILD = new LogCurve(dataSource.getCurveSource('ILD'))
            .setLineStyle({ 'color': 'red', 'width': 2 });
        track.addChild([curveCALI, curveILD]);
        const trackContainer = new TrackContainer()
            .addChild([track]);
        trackContainer.setDepthLimits(minDepth, maxDepth)
            .setModelLimits(new Rect(0, minDepth, track.getBounds().getRight(), maxDepth))
            .setBounds(new Rect(0, minDepth, track.getBounds().getRight(), maxDepth));
        this.shape.addChild(trackContainer);
    }
    getWell(): DeviatedCompositeNode {
        return this.shape;
    }
}
