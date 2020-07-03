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
import { TVDTransformer} from '@int/geotoolkit/deviation/TVDTransformer';
import { PiecewiseTransformer } from '@int/geotoolkit/deviation/PiecewiseTransformer';
import { from } from '@int/geotoolkit/selection/from';
import { Axis } from '@int/geotoolkit/axis/Axis';
import { AnchorType } from '@int/geotoolkit/util/AnchorType';
import { LogMarker } from '@int/geotoolkit/welllog/LogMarker';

const indexTrackWidth = 30;
const wellLogTrackWidth = 50;
const deviatedTrackWidth = wellLogTrackWidth + indexTrackWidth;
export class DeviatedLogView {
    private shape: DeviatedCompositeNode;
    constructor(trajectory, dataSource, minDepth, maxDepth) {
        this.shape = new DeviatedCompositeNode()
            .setDeviation({
                clip: false,
                trajectory,
                trackWidth: deviatedTrackWidth,
                offset: -deviatedTrackWidth / 2,
                transformer: new PiecewiseTransformer({
                    /*scaleWidth: false,
                    minWidth: 10,
                    maxWidth: 50,*/
                    joinSegments: false,
                    outlineSegments: false,
                })
            });
        const factory = TrackFactory.getInstance();
        const indexTrack = factory.createTrack(TrackType.IndexTrack, {
            width: indexTrackWidth,
            border: {
                visible: true
            },
            indextype: 'depth',
            indexunit: 'ft',
            orientation: 'horizontal',
            indextrack: {
                styles: {
                label: {
                major: 'white',
                minor: 'white',
                edge: 'white'
                }, tick: {
                major: '#9e9e9e',
                minor:  '#e0e0e0',
                edge: '#9e9e9e'
            }},
                labelformat: null, axis: {
                    name: '',
                    locale: 'en'
                }
            }
        });
        // customize
        const axis = from(indexTrack).where((node) => node instanceof Axis).selectFirst();
        axis.setProperties({
            tickgenerator: {
                major: {
                    labelangle: 0,
                    labelanchor: AnchorType.LeftTop,
                    labelstyle: {
                        font: '10px Roboto',
                        color: 'white'
                    }
                },
                edge: {
                    labelangle: Math.PI / 2,
                    labelanchor: AnchorType.LeftTop,
                    labelstyle: {
                        font: '10px Roboto',
                        color: 'white'
                    }
                }
            }
        });
        axis.setAutoLabelRotation(false);
        axis.setAutoLabelRotationAngle( -Math.PI / 2);
        const track = factory.createTrack(TrackType.LinearTrack, {
            width: wellLogTrackWidth,
            border: {
                visible: true
            }
        });
        track.setBounds(track.getBounds().clone().setX(indexTrack.getBounds().getRight()));
        track.setFillStyle(new FillStyle({ color: 'rgba( 128, 128, 128, 0.5)' }));
        // Add curves
        const curveCALI = new LogCurve(dataSource.getCurveSource('GR'))
            .setLineStyle({ color: 'green', width: 2 });
        const curveILD = new LogCurve(dataSource.getCurveSource('ILD'))
            .setLineStyle({ color: 'red', width: 2 });
        const marker = this.addMarker((maxDepth - minDepth) / 2, 'Test');
        track.addChild([curveCALI, curveILD, marker]);
        const trackContainer = new TrackContainer()
            .addChild([indexTrack, track]);
        trackContainer.setDepthLimits(minDepth, maxDepth)
            .setModelLimits(new Rect(0, minDepth, track.getBounds().getRight(), maxDepth))
            .setBounds(new Rect(0, minDepth, track.getBounds().getRight(), maxDepth));
        this.shape.addChild(trackContainer);
    }
    addMarker(depth: number, label: string): LogMarker {
        const marker = new LogMarker(depth, label)
            .setLineStyle({
                color: 'black',
                width: 2
            })
            .setTextStyle({
                font: 'bold 14px Roboto',
                color: 'black'
            });
        marker.setVerticalTextOffset(-5)
            .setHorizontalTextOffset(5)
            .setNameLabelPosition(AnchorType.TopCenter)
            .setNameLabel(label)
            .setDepthLabelPosition(AnchorType.BottomCenter)
            .setFillStyleDepth('white')
            .setFillDepthLabel(true)
            .setFillStyleName('white')
            .setFillNameLabel(true);
        return marker;
    }
    getWell(): DeviatedCompositeNode {
        return this.shape;
    }
}